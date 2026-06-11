import express from 'express';
import webhookRoute from './routes/webhook.route';
import { logger } from '../utils/logger';

const app = express();

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use('/api/webhook', webhookRoute);

export const startApi = (port: string | number) => {
  app.listen(port, () => {
    logger.info(`API Server running on port ${port}`);
  });
};
