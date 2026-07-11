import { Router } from 'express';
import type { Request, Response } from 'express';
import { services } from '../config';
import * as http from 'http';
import * as https from 'https';

function proxyRequest(
  targetUrl: string,
  method: string,
  path: string,
  body: unknown,
  query: Record<string, string | string[]>,
  res: Response,
): void {
  const urlObj = new URL(targetUrl);
  urlObj.pathname = path;

  // Append query params
  const queryKeys = Object.keys(query);
  if (queryKeys.length > 0) {
    queryKeys.forEach((key) => {
      const val = query[key];
      if (Array.isArray(val)) {
        val.forEach((v) => urlObj.searchParams.append(key, v));
      } else {
        urlObj.searchParams.append(key, val);
      }
    });
  }

  const options: http.RequestOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  };

  const httpModule = urlObj.protocol === 'https:' ? https : http;

  const req = httpModule.request(options, (proxyRes) => {
    const chunks: Buffer[] = [];
    proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const data = Buffer.concat(chunks);
      res.status(proxyRes.statusCode || 502);
      if (data.length > 0) {
        try {
          res.json(JSON.parse(data.toString()));
        } catch {
          res.send(data.toString());
        }
      } else {
        res.end();
      }
    });
  });

  req.on('error', (err) => {
    console.error(`[Admin Proxy] Error proxying ${method} ${path}:`, err.message);
    res.status(502).json({
      error: 'BAD_GATEWAY',
      message: `Failed to reach admin service: ${err.message}`,
    });
  });

  req.on('timeout', () => {
    req.destroy();
    res.status(504).json({
      error: 'GATEWAY_TIMEOUT',
      message: 'Admin service did not respond in time',
    });
  });

  if (body && method !== 'GET' && method !== 'HEAD') {
    req.write(JSON.stringify(body));
  }
  req.end();
}

export function createAdminRoutes(): Router {
  const router = Router();
  const adminBase = services.admin;

  // GET /users → GET /admin/users
  router.get('/users', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'GET', '/admin/users', null, req.query as Record<string, string | string[]>, res);
  });

  // GET /disputes → GET /admin/disputes
  router.get('/disputes', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'GET', '/admin/disputes', null, req.query as Record<string, string | string[]>, res);
  });

  // POST /users/:id/ban → POST /admin/users/:userId/ban
  router.post('/users/:id/ban', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'POST', `/admin/users/${req.params.id}/ban`, req.body, req.query as Record<string, string | string[]>, res);
  });

  // POST /sellers/:id/approve → POST /admin/sellers/:sellerId/approve
  router.post('/sellers/:id/approve', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'POST', `/admin/sellers/${req.params.id}/approve`, req.body, req.query as Record<string, string | string[]>, res);
  });

  // POST /sellers/:id/verify → POST /admin/sellers/:sellerId/verify
  router.post('/sellers/:id/verify', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'POST', `/admin/sellers/${req.params.id}/verify`, req.body, req.query as Record<string, string | string[]>, res);
  });

  // POST /disputes/:orderId/refund → POST /admin/disputes/:orderId/refund
  router.post('/disputes/:orderId/refund', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'POST', `/admin/disputes/${req.params.orderId}/refund`, req.body, req.query as Record<string, string | string[]>, res);
  });

  // GET /stats → GET /admin/stats
  router.get('/stats', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'GET', '/admin/stats', null, req.query as Record<string, string | string[]>, res);
  });

  // GET /health → GET /admin/health
  router.get('/health', (req: Request, res: Response) => {
    proxyRequest(adminBase, 'GET', '/admin/health', null, req.query as Record<string, string | string[]>, res);
  });

  return router;
}
