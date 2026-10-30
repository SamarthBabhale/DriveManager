import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server forwards /api to Drive-Service, so the browser sees one origin (no CORS problems).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.DRIVE_API || 'http://localhost:8091',
        changeOrigin: true,
        configure: proxy => proxy.on('proxyReq', req => req.removeHeader('origin'))
      }
    }
  }
});
