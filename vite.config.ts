import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Embedded (memory-router) builds use relative asset URLs; routed builds need absolute ones for nested paths.
  base: process.env.VITE_ROUTER === 'memory' ? './' : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { globals: true, environment: 'node', include: ['src/**/*.test.ts'] },
});
