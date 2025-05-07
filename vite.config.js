import { defineConfig } from 'vite';

export default defineConfig({
  server: {
      proxy: {
            '/.netlify/functions': 'http://localhost:8888'
                }
                  }
                  });
                  