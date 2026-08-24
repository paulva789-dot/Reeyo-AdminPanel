import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3005';
  const remote = /^https:/i.test(target);

  // The deployed admin-api keeps an origin allowlist and returns 500 — not a
  // clean CORS rejection — for anything outside it, so a dev origin like
  // http://localhost:5180 fails every request. When proxying to a remote
  // backend we therefore present an allowlisted origin. Against a local
  // admin-api this is unnecessary, so it is left alone.
  const allowlistedOrigin = env.VITE_PROXY_ORIGIN || 'https://admin.usereeyo.com';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      watch: {
        // The checks are Node scripts that drive the app, not part of it.
        // Watching them means editing a test triggers a full page reload in the
        // browser running that test, which fails the run for no reason.
        ignored: ['**/checks/**'],
      },
      proxy: {
        // Same-origin in dev so the admin-api's HTTP-only auth cookies are
        // sent and set without cross-site cookie restrictions.
        '/api/v1': {
          target,
          changeOrigin: true,
          secure: true,
          // Rewrite Set-Cookie so cookies scoped to the API host are accepted
          // on localhost, and drop Secure so they survive plain http in dev.
          cookieDomainRewrite: '',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (remote) proxyReq.setHeader('origin', allowlistedOrigin);
            });
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                proxyRes.headers['set-cookie'] = cookies.map((c) =>
                  c.replace(/;\s*Secure/gi, '').replace(/;\s*SameSite=None/gi, '; SameSite=Lax'));
              }
            });
          },
        },
      },
    },
  };
});
