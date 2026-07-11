import express from 'express';
import { config } from './config';
import { createAdminRoutes } from './routes/admin';

const app = express();

app.use(express.json());

// Mount admin routes at /v1/admin
app.use('/v1/admin', createAdminRoutes());

// Health check for the gateway itself
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.get('/ready', (_req, res) => {
  res.json({ status: 'ready', service: 'api-gateway' });
});

app.listen(config.port, () => {
  console.log(`[API Gateway] Listening on port ${config.port}`);
});

export default app;
