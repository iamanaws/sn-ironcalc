import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createWriteStream, existsSync, readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import archiver from 'archiver';
import pkg from './package.json';

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : './';
  const distDir = process.env.OUT_DIR ?? 'dist';
  const distSrcDir = `${distDir}/src`;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
  };
  const rollupInput: Record<string, string> = {
    index: 'src/index.html',
    demo: 'src/demo/demo.html',
  };

  return {
    base,
    css: { preprocessorOptions: { scss: { api: 'modern' } } },
    optimizeDeps: { exclude: ['@ironcalc/wasm'] },
    server: {
      open: '/src/demo/demo.html',
      headers: corsHeaders,
    },
    build: {
      outDir: distDir,
      rollupOptions: {
        external: ['filesafe-js'],
        input: rollupInput,
        output: {
          // Split large deps so index/demo share cached chunks
          manualChunks: {
            vendor: ['react', 'react-dom', 'sn-extension-api'],
            ironcalc: ['@ironcalc/workbook'],
          },
        },
      },
      reportCompressedSize: false,
    },
    plugins: [
      react(),
      {
        name: 'post-build',
        closeBundle() {
          if (!existsSync(distDir)) return;

          const moveHtml = (from: string, to: string) => {
            if (existsSync(from)) renameSync(from, to);
          };
          const normalizeAssets = (htmlPath: string) => {
            if (!existsSync(htmlPath)) return;
            const content = readFileSync(htmlPath, 'utf-8');
            writeFileSync(htmlPath, content.replace(/(\.\.\/)+assets\//g, './assets/'));
          };

          // Move HTML to root, clean src/, and normalize asset paths
          moveHtml(`${distSrcDir}/index.html`, `${distDir}/index.html`);
          moveHtml(`${distSrcDir}/demo/demo.html`, `${distDir}/demo.html`);
          if (existsSync(distSrcDir)) rmSync(distSrcDir, { recursive: true });
          normalizeAssets(`${distDir}/index.html`);
          normalizeAssets(`${distDir}/demo.html`);

          // Replace $VERSION$ in ext.json
          const extPath = `${distDir}/ext.json`;
          if (existsSync(extPath)) {
            const content = readFileSync(extPath, 'utf-8').replace(/\$VERSION\$/g, pkg.version);
            writeFileSync(extPath, content);
          }

          // Zip dist
          const archive = archiver('zip', { zlib: { level: 9 } });
          archive.pipe(createWriteStream(`${distDir}/latest.zip`));
          archive.glob('**/*', { cwd: distDir, ignore: ['latest.zip', 'demo.html', 'assets/demo-*'], });
          return archive.finalize();
        },
      },
    ],
  };
});
