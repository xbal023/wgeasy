import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../../services/payment.service';
import { config } from '../../config';

export const verifySignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ error: 'Missing or invalid signature' });
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'Missing raw body' });
  }

  const isValid = PaymentService.verifyWebhookSignature(rawBody.toString('utf8'), signature, config.PAYMENT_WEBHOOK_SECRET);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
};
