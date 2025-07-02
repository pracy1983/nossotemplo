import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js'],
  },
  build: {
    rollupOptions: {
      // Garantir que o Supabase seja processado corretamente
      external: [],
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Evitar minificação para facilitar a depuração
    minify: false,
    sourcemap: true
  },
});
