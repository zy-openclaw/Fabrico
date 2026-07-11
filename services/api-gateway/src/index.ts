import express from 'express';
import { config } from './config';

const app = express();

app.use(express.json());

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
