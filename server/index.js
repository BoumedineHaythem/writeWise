import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { HttpError } from './errors.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import learningRoutes from './routes/learning.js';
import sessionRoutes from './routes/sessions.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true, aiFeedback: config.aiFeedback }));
  api.use(authRoutes, contentRoutes, learningRoutes, sessionRoutes);
  api.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));
  app.use('/api', api);

  // In production, serve the built frontend (npm run build) from the same server.
  if (fs.existsSync(config.distDir)) {
    app.use(express.static(config.distDir));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(config.distDir, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Request body is not valid JSON.');
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
      ...(err.details || {}),
    });
  });

  return app;
}
