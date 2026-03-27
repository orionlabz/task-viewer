import './styles/base.css';
import './styles/components.css';
import './styles/editor.css';
import { S } from './state.js';
import { checkBridge } from './api.js';
import { initRouter, registerScreen } from './router.js';
import { mountHome, unmountHome } from './screens/home.js';

// Register screens (lazy imports resolved when navigated to)
registerScreen('home', { mount: mountHome, unmount: unmountHome });
registerScreen('project', {
  mount: async () => { const m = await import('./screens/project.js'); m.mountProject(); },
  unmount: async () => { const m = await import('./screens/project.js'); m.unmountProject?.(); },
});
registerScreen('editor', {
  mount: async () => { const m = await import('./screens/editor.js'); m.mountEditor(); },
  unmount: async () => { const m = await import('./screens/editor.js'); m.unmountEditor?.(); },
});
registerScreen('theme-editor', {
  mount: async () => { const m = await import('./screens/theme-editor.js'); m.mountThemeEditor(); },
  unmount: async () => { const m = await import('./screens/theme-editor.js'); m.unmountThemeEditor?.(); },
});

async function init() {
  S.bridgeAvailable = await checkBridge();
  initRouter();
}

init();
