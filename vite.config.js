import { defineConfig } from 'vite';
import path from 'path';
import { resolve } from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
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
