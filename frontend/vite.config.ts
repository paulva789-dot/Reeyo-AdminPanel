import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Same-origin in dev so the admin-api's HTTP-only auth cookies are
      // sent/set without cross-site cookie restrictions.
      '/api/v1': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
});
