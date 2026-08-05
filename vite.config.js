import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite configuration.
 *
 * Tailwind CSS v4 is wired through PostCSS (see `postcss.config.js`), which Vite
 * picks up automatically — no extra plugin registration is required here.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: 5173,
      open: true,
      /**
       * When a real backend is available, set `VITE_API_URL` and point the app at
       * the relative `/api` prefix — the proxy below forwards it and keeps
       * cookies/CORS out of the way during development.
       */
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },

    preview: {
      port: 4173,
    },

    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          // Keep vendor code in stable chunks for better long-term caching.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
