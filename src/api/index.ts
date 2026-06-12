import express from 'express';
import webhookRoute from './routes/webhook.route';
import { webhookCallback } from 'grammy';
import { bot } from '../bot';
import { logger } from '../utils/logger';

const app = express();

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use('/api/webhook', webhookRoute);
app.use('/api/bot-webhook', webhookCallback(bot, 'express'));

export const startApi = (port: string | number) => {
  app.listen(port, () => {
    logger.info(`API Server running on port ${port}`);
  });
};
