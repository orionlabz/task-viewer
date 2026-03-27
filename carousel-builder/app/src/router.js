import { S } from './state.js';
import { api } from './api.js';

const screens = {};

export function registerScreen(name, { mount, unmount }) {
  screens[name] = { mount, unmount };
}

// ── URL ↔ screen mapping ──────────────────────────────────────────────────────

function toPath(screen, params) {
  if (screen === 'project')      return `/projects/${params.projectId}`;
  if (screen === 'editor')       return `/editor/${params.carouselId}`;
  if (screen === 'theme-editor') {
    return (params.context === 'project' && params.projectId)
      ? `/projects/${params.projectId}/theme`
      : '/theme';
  }
  return '/';
}

function fromPath(pathname) {
  let m;
  if ((m = pathname.match(/^\/projects\/(\d+)\/theme$/)))
    return { screen: 'theme-editor', params: { context: 'project', projectId: Number(m[1]) } };
  if ((m = pathname.match(/^\/projects\/(\d+)$/)))
    return { screen: 'project', params: { projectId: Number(m[1]) } };
  if ((m = pathname.match(/^\/editor\/(\d+)$/)))
    return { screen: 'editor', params: { carouselId: Number(m[1]) } };
  if (pathname === '/theme')
    return { screen: 'theme-editor', params: { context: 'global' } };
  return { screen: 'home', params: {} };
}

// ── Navigation ────────────────────────────────────────────────────────────────

export async function navigate(screen, params = {}) {
  // Unmount current
  screens[S.screen]?.unmount?.();

  S.screen = screen;
  Object.assign(S, params);

  // Sync URL (skip pushState if URL already matches — e.g. popstate)
  const path = toPath(screen, params);
  if (window.location.pathname !== path) {
    window.history.pushState({ screen, params }, '', path);
  }

  // Load context data
  if (screen === 'project' && params.projectId) {
    S.project = await api.projects.get(params.projectId);
    S.theme = await api.projects.theme(params.projectId);
  }
  if (screen === 'editor' && params.carouselId) {
    const carousel = await api.carousels.get(params.carouselId);
    S.carousel = carousel;
    S.carouselId = carousel.id;
    S.slides = JSON.parse(carousel.slides_json || '[]');
    S.images = JSON.parse(carousel.images_json || '{}');
    S.active = 0;
    if (!S.theme) S.theme = await api.projects.theme(carousel.project_id);
  }

  // Mount new screen
  screens[screen]?.mount?.();
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

export function initRouter() {
  window.addEventListener('popstate', () => {
    const { screen, params } = fromPath(window.location.pathname);
    navigate(screen, params);
  });

  const { screen, params } = fromPath(window.location.pathname);
  navigate(screen, params);
}
