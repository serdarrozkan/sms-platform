import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/sms/',
  server: {
    port: 5173,
    proxy: {
      '/sms/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sms/, ''),
      },
    },
  },
});
