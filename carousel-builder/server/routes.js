import { generateCarousel, refineSlide, brainstormIdeas } from './claude.js';
import {
  listThemes, getTheme, createTheme, updateTheme, deleteTheme,
  getGlobalTheme, setGlobalTheme,
  listProjects, getProject, createProject, updateProject, deleteProject, resolveTheme,
  listCarousels, getCarousel, createCarousel, updateCarousel, deleteCarousel,
} from './db.js';
import { saveBrandLogo } from './storage.js';

export async function handleRoute(req, res, readBody, json) {
  const url = new URL(req.url, `http://localhost`);
  const path = url.pathname;
  const method = req.method;

  // ── AI endpoints ─────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/generate')
    return json(res, await generateCarousel(await readBody(req)));
  if (method === 'POST' && path === '/refine')
    return json(res, await refineSlide(await readBody(req)));
  if (method === 'POST' && path === '/brainstorm')
    return json(res, await brainstormIdeas(await readBody(req)));

  // ── Themes ───────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/themes')
    return json(res, listThemes());
  if (method === 'GET' && path === '/themes/global')
    return json(res, getGlobalTheme());
  if (method === 'POST' && path === '/themes') {
    const data = await readBody(req);
    const id = createTheme(data);
    return json(res, getTheme(id), 201);
  }
  if (method === 'GET' && /^\/themes\/\d+$/.test(path))
    return json(res, getTheme(Number(path.split('/')[2])));
  if (method === 'PATCH' && /^\/themes\/\d+$/.test(path)) {
    const id = Number(path.split('/')[2]);
    updateTheme(id, await readBody(req));
    return json(res, getTheme(id));
  }
  if (method === 'DELETE' && /^\/themes\/\d+$/.test(path)) {
    deleteTheme(Number(path.split('/')[2]));
    return json(res, { ok: true });
  }
  if (method === 'POST' && path === '/themes/global') {
    const { id } = await readBody(req);
    setGlobalTheme(id);
    return json(res, { ok: true });
  }

  // ── Projects ─────────────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/projects')
    return json(res, listProjects());
  if (method === 'POST' && path === '/projects') {
    const { name } = await readBody(req);
    const id = createProject(name);
    return json(res, getProject(id), 201);
  }
  if (method === 'GET' && /^\/projects\/\d+$/.test(path))
    return json(res, getProject(Number(path.split('/')[2])));
  if (method === 'PATCH' && /^\/projects\/\d+$/.test(path)) {
    const id = Number(path.split('/')[2]);
    updateProject(id, await readBody(req));
    return json(res, getProject(id));
  }
  if (method === 'DELETE' && /^\/projects\/\d+$/.test(path)) {
    deleteProject(Number(path.split('/')[2]));
    return json(res, { ok: true });
  }
  if (method === 'GET' && /^\/projects\/\d+\/theme$/.test(path)) {
    return json(res, resolveTheme(Number(path.split('/')[2])));
  }

  // ── Carousels ────────────────────────────────────────────────────────────────
  if (method === 'GET' && /^\/projects\/\d+\/carousels$/.test(path))
    return json(res, listCarousels(Number(path.split('/')[2])));
  if (method === 'POST' && /^\/projects\/\d+\/carousels$/.test(path)) {
    const projectId = Number(path.split('/')[2]);
    const { title } = await readBody(req);
    const id = createCarousel(projectId, title);
    return json(res, getCarousel(id), 201);
  }
  if (method === 'GET' && /^\/carousels\/\d+$/.test(path))
    return json(res, getCarousel(Number(path.split('/')[2])));
  if (method === 'PATCH' && /^\/carousels\/\d+$/.test(path)) {
    const id = Number(path.split('/')[2]);
    const data = await readBody(req);
    if (data.slides) data.slides_json = JSON.stringify(data.slides);
    if (data.images) data.images_json = JSON.stringify(data.images);
    delete data.slides; delete data.images;
    updateCarousel(id, data);
    return json(res, getCarousel(id));
  }
  if (method === 'DELETE' && /^\/carousels\/\d+$/.test(path)) {
    deleteCarousel(Number(path.split('/')[2]));
    return json(res, { ok: true });
  }

  // ── Brand upload ─────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/upload/brand') {
    const filename = req.headers['x-filename'] || 'logo.png';
    const url = await saveBrandLogo(req, filename);
    return json(res, { url });
  }

  return null; // not handled
}
