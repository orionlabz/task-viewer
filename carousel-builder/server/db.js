import Database from 'better-sqlite3';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../storage/carousel-builder.db');
mkdirSync(resolve(__dirname, '../storage'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Sem título',
  font_display TEXT NOT NULL DEFAULT 'Playfair Display',
  font_body TEXT NOT NULL DEFAULT 'Inter',
  color_bg TEXT NOT NULL DEFAULT '#000000',
  color_text TEXT NOT NULL DEFAULT '#e8e8e8',
  color_emphasis TEXT NOT NULL DEFAULT '#CCFF00',
  color_secondary TEXT NOT NULL DEFAULT '#666666',
  color_detail TEXT NOT NULL DEFAULT '#2a2a2a',
  color_border TEXT NOT NULL DEFAULT '#1e1e1e',
  brand_name TEXT NOT NULL DEFAULT 'Marca',
  brand_symbol TEXT NOT NULL DEFAULT '⬥',
  brand_logo_dark TEXT,
  brand_logo_light TEXT,
  nav_left TEXT NOT NULL DEFAULT 'CATEGORIA',
  nav_right TEXT NOT NULL DEFAULT 'SÉRIE',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carousels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slides_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '{}',
  thumbnail_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

// Seed: ensure global theme exists
{
  const themeCount = db.prepare('SELECT COUNT(*) as c FROM themes').get();
  if (themeCount.c === 0) {
    const info = db.prepare(`INSERT INTO themes (name) VALUES ('Dark Luxury')`).run();
    db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('global_theme_id', ?)`).run(String(info.lastInsertRowid));
  }
  // Ensure global_theme_id setting always exists (in case it was never seeded)
  const hasSetting = db.prepare("SELECT 1 FROM settings WHERE key = 'global_theme_id'").get();
  if (!hasSetting) {
    const firstTheme = db.prepare('SELECT id FROM themes ORDER BY id ASC LIMIT 1').get();
    if (firstTheme) {
      db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('global_theme_id', ?)`).run(String(firstTheme.id));
    }
  }
}

// ─── Column allowlists (prevent SQL injection via dynamic column names) ─────────

const THEME_COLS = new Set(['name','font_display','font_body','color_bg','color_text','color_emphasis','color_secondary','color_detail','color_border','brand_name','brand_symbol','brand_logo_dark','brand_logo_light','nav_left','nav_right']);
const PROJECT_COLS = new Set(['name','theme_id']);
const CAROUSEL_COLS = new Set(['title','slides_json','images_json','thumbnail_path','project_id']);

// ─── Theme queries ─────────────────────────────────────────────────────────────

export function getTheme(id) {
  return db.prepare('SELECT * FROM themes WHERE id = ?').get(id);
}

export function listThemes() {
  return db.prepare('SELECT * FROM themes ORDER BY created_at ASC').all();
}

export function createTheme(data = {}) {
  const keys = Object.keys(data).filter(k => THEME_COLS.has(k));
  if (!keys.length) {
    return db.prepare("INSERT INTO themes (name) VALUES ('Sem título')").run().lastInsertRowid;
  }
  const placeholders = keys.map(() => '?').join(', ');
  return db.prepare(`INSERT INTO themes (${keys.join(', ')}) VALUES (${placeholders})`).run(...keys.map(k => data[k])).lastInsertRowid;
}

export function updateTheme(id, data) {
  const keys = Object.keys(data).filter(k => THEME_COLS.has(k));
  if (!keys.length) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE themes SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map(k => data[k]), id);
}

export function deleteTheme(id) {
  db.prepare('DELETE FROM themes WHERE id = ?').run(id);
}

export function getGlobalTheme() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'global_theme_id'").get();
  if (!row) return null;
  return getTheme(Number(row.value)) || null;
}

export function setGlobalTheme(id) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('global_theme_id', ?)").run(String(id));
}

// ─── Project queries ────────────────────────────────────────────────────────────

export function listProjects() {
  return db.prepare(`
    SELECT p.*, t.name as theme_name,
      (SELECT COUNT(*) FROM carousels WHERE project_id = p.id) as carousel_count
    FROM projects p
    LEFT JOIN themes t ON t.id = p.theme_id
    ORDER BY p.updated_at DESC
  `).all();
}

export function getProject(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(name) {
  return db.prepare("INSERT INTO projects (name) VALUES (?)").run(name).lastInsertRowid;
}

export function updateProject(id, data) {
  const keys = Object.keys(data).filter(k => PROJECT_COLS.has(k));
  if (!keys.length) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE projects SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map(k => data[k]), id);
}

export function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

export function resolveTheme(projectId) {
  const project = getProject(projectId);
  if (project?.theme_id) return getTheme(project.theme_id);
  return getGlobalTheme();
}

// ─── Carousel queries ───────────────────────────────────────────────────────────

export function listCarousels(projectId) {
  return db.prepare('SELECT * FROM carousels WHERE project_id = ? ORDER BY updated_at DESC').all(projectId);
}

export function getCarousel(id) {
  return db.prepare('SELECT * FROM carousels WHERE id = ?').get(id);
}

export function createCarousel(projectId, title) {
  return db.prepare("INSERT INTO carousels (project_id, title) VALUES (?, ?)").run(projectId, title).lastInsertRowid;
}

export function updateCarousel(id, data) {
  const keys = Object.keys(data).filter(k => CAROUSEL_COLS.has(k));
  if (!keys.length) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE carousels SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...keys.map(k => data[k]), id);
}

export function deleteCarousel(id) {
  db.prepare('DELETE FROM carousels WHERE id = ?').run(id);
}
