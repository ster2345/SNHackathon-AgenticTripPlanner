import { defineConfig } from 'vite';
export default defineConfig({ base: './', server: { port: 5173, strictPort: true,
  proxy: Object.fromEntries(['/groups', '/demo'].map(path => [path, {
    target: 'http://127.0.0.1:8765', changeOrigin: true,
    configure(proxy) { proxy.on('proxyReq', request => request.removeHeader('origin')); },
  }])) } });
