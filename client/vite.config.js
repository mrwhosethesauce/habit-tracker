import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev: run `vercel dev` (serves api/ + client) OR run this dev server
// standalone and proxy /api to `vercel dev`'s port (see README).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
