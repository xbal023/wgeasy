import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';

export class PaymentService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.PAYMENT_API_KEY;
    this.baseUrl = config.PAYMENT_BASE_URL;
  }

  private signRequest(method: string, path: string, body: unknown = null) {
    if (!this.apiKey) throw new Error('apiKey is required');
    if (!method) throw new Error('method is required');
    if (!path || !path.startsWith('/')) throw new Error("path must start with '/' and be path-only");

    const ts = String(Math.floor(Date.now() / 1000));
    const m = String(method).toUpperCase();
    let bodyString = '';

    if (body === null || body === undefined) {
      bodyString = '';
    } else if (typeof body === 'string') {
      bodyString = body;
    } else {
      bodyString = JSON.stringify(body);
    }

    const message = `${ts}\n${m}\n${path}\n${bodyString}`;
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(message, 'utf8');
    const signature = hmac.digest('base64');

    return { timestamp: ts, signature, bodyString };
  }

  private buildHeaders({ timestamp, signature }: { timestamp: string; signature: string }) {
    return {
      'X-API-Key': this.apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  private async request(path: string, method: 'GET' | 'POST', body?: unknown) {
    const { timestamp, signature, bodyString } = this.signRequest(method, path, body);
    const headers = this.buildHeaders({ timestamp, signature });

    try {
      const response = await axios({
        url: `${this.baseUrl}${path}`,
        method,
        headers,
        data: bodyString || undefined,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Payment API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async createTransactionQRIS({ amount, refId, customer, products, note = 'VPN Order', expiresInMinutes = 60 }: { amount: number, refId: string, customer: { name: string, email: string, phone: string }, products: Array<{ name: string, price: number, quantity: number }>, note?: string, expiresInMinutes?: number }) {
    const path = '/v1/api/transactions';
    const body = {
      merchant_id: config.PAYMENT_MERCHANT_ID,
      channel_code: 'QRIS',
      amount,
      ref_id: refId,
      fee_direction: 'merchant',
      note,
      expires_in_minutes: expiresInMinutes,
      metadata: { customer, products }
    };
    return this.request(path, 'POST', body);
  }

  static verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody, 'utf8');
    const expected = hmac.digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

export const paymentService = new PaymentService();
