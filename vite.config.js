import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static single-page app. Base is relative so the build can be served from
// any sub-path (GitHub Pages, a preview host, or opened locally).
export default defineConfig({
  base: './',
  plugins: [react()],
});
