import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Поддержка и VITE_*, и NEXT_PUBLIC_* из .env.local
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
});
