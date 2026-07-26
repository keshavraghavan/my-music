/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static single-page app. `next build` emits a fully prerendered site to
  // out/, so it can be served by any static host with no Node runtime.
  //
  // Unlike Vite's `base: './'`, Next emits absolute asset paths. To serve from
  // a sub-path (e.g. a GitHub Pages project site), set basePath/assetPrefix:
  //   basePath: '/my-music', assetPrefix: '/my-music',
  output: 'export',
};

export default nextConfig;
