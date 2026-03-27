import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 5173,
    historyApiFallback: true,
    proxy: {
      '/generate': 'http://localhost:37776',
      '/refine': 'http://localhost:37776',
      '/brainstorm': 'http://localhost:37776',
      '/ping': 'http://localhost:37776',
      '/projects': 'http://localhost:37776',
      '/themes': 'http://localhost:37776',
      '/carousels': 'http://localhost:37776',
      '/upload': 'http://localhost:37776',
      '/storage': 'http://localhost:37776',
    },
  },
});
