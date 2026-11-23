import { defineConfig } from 'vite';

export default defineConfig({
  // @ffmpeg/ffmpeg spawns a module worker that imports other files;
  // Vite's default IIFE worker format can't bundle that, so use ES modules.
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] }
});
