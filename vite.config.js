import { defineConfig } from 'vite';
import path from 'path';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@iota/core': path.resolve(__dirname, './src/modules/core'),
      '@iota/ui': path.resolve(__dirname, './src/modules/ui'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
