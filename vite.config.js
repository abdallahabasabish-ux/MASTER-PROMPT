import { defineConfig } from 'vite';

export default defineConfig({
  base: '/dr-science/', // Replace with your repo name
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
