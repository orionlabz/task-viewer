#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, unlinkSync, createWriteStream, openSync, closeSync } from 'node:fs';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, '..');
const SERVER = resolve(PLUGIN_ROOT, 'server', 'mcp-server.js');
const PORT = 37776;
const PID_FILE = '/tmp/carousel-bridge.pid';
const LOG_FILE = '/tmp/carousel-bridge.log';

const [,, cmd] = process.argv;

const COMMANDS = {
  start:  cmdStart,
  stop:   cmdStop,
  status: cmdStatus,
  logs:   cmdLogs,
};

const fn = COMMANDS[cmd];
if (!fn) {
  console.log(`carousel <start|stop|status|logs>`);
  process.exit(cmd ? 1 : 0);
}
fn();

// Command implementations (to be filled in by subsequent tasks)
function cmdStart() {
  const pid = readPid();
  if (isRunning(pid)) {
    console.log(`carousel bridge already running (PID ${pid}) on http://localhost:${PORT}`);
    return;
  }
  const logFd = openSync(LOG_FILE, 'a');
  const child = spawn('node', [SERVER], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  closeSync(logFd);
  writeFileSync(PID_FILE, String(child.pid));
  child.unref();
  console.log(`carousel bridge started (PID ${child.pid}) — http://localhost:${PORT}`);
  console.log(`logs: ${LOG_FILE}`);
  setTimeout(() => {
    const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
    const child = spawn(opener, [`http://localhost:${PORT}`], { detached: true, stdio: 'ignore' });
    child.on('error', () => {}); // ignore if opener not available
    child.unref();
  }, 800);
}

function readPid() {
  try { return parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10); } catch { return null; }
}

function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function cmdStop() {
  const pid = readPid();
  if (!isRunning(pid)) {
    console.log('carousel bridge is not running.');
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    console.log(`carousel bridge stopped (PID ${pid}).`);
  } catch (e) {
    console.error(`Failed to stop: ${e.message}`);
    process.exit(1);
  }
}
function cmdStatus() {
  const pid = readPid();
  if (!isRunning(pid)) {
    console.log('carousel bridge: stopped');
    return;
  }
  const ps = spawn('ps', ['-o', 'etime=', '-p', String(pid)], { stdio: ['ignore', 'pipe', 'ignore'] });
  let etime = '';
  ps.stdout.on('data', d => (etime += d));
  ps.on('close', () => {
    console.log(`carousel bridge: running`);
    console.log(`  PID:    ${pid}`);
    console.log(`  Port:   ${PORT}`);
    console.log(`  Uptime: ${etime.trim()}`);
    console.log(`  Logs:   ${LOG_FILE}`);
  });
}
function cmdLogs() {
  if (!existsSync(LOG_FILE)) {
    console.log(`No log file yet. Run 'carousel start' first.`);
    process.exit(1);
  }
  spawn('tail', ['-f', LOG_FILE], { stdio: 'inherit' });
}
