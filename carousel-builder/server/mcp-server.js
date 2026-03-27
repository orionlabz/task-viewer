import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { handleRoute } from './routes.js';
import { serveStorageFile } from './storage.js';
import { generateCarousel, refineSlide, brainstormIdeas } from './claude.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '../app/dist');
const PORT = 37776;
const IS_MCP = process.argv.includes('--mcp');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
}

function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

async function serveStatic(req, res) {
  const pathname = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = join(APP_DIR, pathname);
  if (!filePath.startsWith(APP_DIR)) { json(res, { error: 'Forbidden' }, 403); return true; }
  try {
    const data = await readFile(filePath);
    cors(res);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
    return true;
  } catch { return false; }
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
  if (req.url === '/ping') return json(res, { ok: true });
  if (req.url?.startsWith('/storage/')) return serveStorageFile(req.url, res);

  try {
    const handled = await handleRoute(req, res, readBody, json);
    if (handled !== null) return;
  } catch (e) {
    return json(res, { error: e.message }, 500);
  }

  const served = await serveStatic(req, res);
  if (!served) {
    // SPA fallback: paths without a file extension are frontend routes
    const hasExt = /\.\w+$/.test(req.url.split('?')[0]);
    if (!hasExt) {
      const indexPath = join(APP_DIR, 'index.html');
      try {
        const data = await readFile(indexPath);
        cors(res);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      } catch { json(res, { error: 'Not found' }, 404); }
    } else {
      json(res, { error: 'Not found' }, 404);
    }
  }
}

// ─── HTTP mode ────────────────────────────────────────────────────────────────

if (!IS_MCP) {
  createServer(handleRequest).listen(PORT, () => {
    console.log(`Carousel Builder bridge running on http://localhost:${PORT}`);
  });
}

// ─── MCP mode ─────────────────────────────────────────────────────────────────

if (IS_MCP) {
  const server = new Server({ name: 'carousel-builder', version: '0.1.0' }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: 'generate_carousel', description: 'Gera slides para um carrossel', inputSchema: { type: 'object', properties: { topic: { type: 'string' }, audience: { type: 'string' }, slideCount: { type: 'number' }, cta: { type: 'string' } }, required: ['topic'] } },
      { name: 'refine_slide', description: 'Refina um slide com instrução', inputSchema: { type: 'object', properties: { slide: { type: 'object' }, instruction: { type: 'string' } }, required: ['slide', 'instruction'] } },
      { name: 'brainstorm_ideas', description: 'Sugere temas para carrosséis', inputSchema: { type: 'object', properties: { niche: { type: 'string' }, count: { type: 'number' } }, required: ['niche'] } },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params: { name, arguments: args } }) => {
    const fns = { generate_carousel: generateCarousel, refine_slide: refineSlide, brainstorm_ideas: brainstormIdeas };
    const fn = fns[name];
    if (!fn) return { content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }], isError: true };
    const result = await fn(args);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
