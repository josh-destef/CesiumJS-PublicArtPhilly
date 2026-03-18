// vite.config.ts
// This file configures Vite, our build tool.
// The two plugins here are:
//   1. @vitejs/plugin-react   — enables JSX/TSX and React fast-refresh in dev
//   2. vite-plugin-cesium     — automatically copies the CesiumJS static assets
//      (terrain, imagery workers, Web Workers) into the dist/ folder so the
//      3D engine can find them at runtime.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [
    react(),
    cesium(), // handles all CesiumJS asset wiring for us
  ],
});
