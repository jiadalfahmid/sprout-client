import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function apiMiddlewarePlugin(env: Record<string, string>): Plugin {
  const createMiddleware = (server: any) => async (req: any, res: any, next: any) => {
    if (!req.url || !req.url.startsWith('/api/')) {
      return next();
    }

    const urlPath = req.url.split('?')[0];

    // Format response to support VercelResponse methods (.status and .json)
    const vRes: any = res;
    if (!vRes.status) {
      vRes.status = (code: number) => {
        res.statusCode = code;
        return vRes;
      };
    }
    if (!vRes.json) {
      vRes.json = (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return vRes;
      };
    }

    // Parse JSON body if present
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(buffers).toString('utf-8');
      try {
        req.body = raw ? JSON.parse(raw) : {};
      } catch {
        req.body = {};
      }
    }

    try {
      if (urlPath === '/api/upload-image') {
        if (!process.env.IMGBB_API_KEY && env.IMGBB_API_KEY) {
          process.env.IMGBB_API_KEY = env.IMGBB_API_KEY;
        }
        const mod = await server.ssrLoadModule('/api/upload-image.ts');
        return await mod.default(req, vRes);
      }

      if (urlPath === '/api/accept-invite') {
        const mod = await server.ssrLoadModule('/api/accept-invite.ts');
        return await mod.default(req, vRes);
      }

      if (urlPath === '/api/delete-image') {
        const mod = await server.ssrLoadModule('/api/delete-image.ts');
        return await mod.default(req, vRes);
      }
    } catch (err: any) {
      console.error(`Error executing API route ${urlPath}:`, err);
      if (!res.writableEnded) {
        vRes.status(500).json({ success: false, error: err?.message || 'Server error' });
      }
      return;
    }

    next();
  };

  return {
    name: 'api-serverless-plugin',
    configureServer(server) {
      server.middlewares.use(createMiddleware(server));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(server));
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    if (env.IMGBB_API_KEY && !process.env.IMGBB_API_KEY) {
      process.env.IMGBB_API_KEY = env.IMGBB_API_KEY;
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiMiddlewarePlugin(env)],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
