import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To add polyfills you need to require the desired module
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add these aliases for Node.js modules
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'http': 'stream-http',
      'https': 'https-browserify',
      'os': 'os-browserify/browser',
      'path': 'path-browserify',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
    },
  },
});