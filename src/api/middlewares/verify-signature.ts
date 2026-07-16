import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment.service';
import { config } from '../../config';
import { getDynamicConfig } from '../../utils/config.util';

export const verifySignature = async (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ error: 'Missing or invalid signature' });
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'Missing raw body' });
  }

  const webhookSecret = await getDynamicConfig('payment_webhook_secret', config.PAYMENT_WEBHOOK_SECRET || '');

  const isValid = PaymentService.verifyWebhookSignature(rawBody.toString('utf8'), signature, webhookSecret);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
};
