import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config';
import { getDynamicConfig } from '../utils/config.util';

export class PaymentService {
  private async getConfig() {
    const apiKey = await getDynamicConfig('payment_api_key', config.PAYMENT_API_KEY || '');
    const baseUrl = await getDynamicConfig('payment_base_url', config.PAYMENT_BASE_URL || 'https://pay.xoftware.id');
    const merchantId = await getDynamicConfig('payment_merchant_id', config.PAYMENT_MERCHANT_ID || '');
    return { apiKey, baseUrl, merchantId };
  }

  private signRequest(method: string, path: string, body: unknown, apiKey: string) {
    if (!apiKey) throw new Error('apiKey is required');
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
    const hmac = crypto.createHmac('sha256', apiKey);
    hmac.update(message, 'utf8');
    const signature = hmac.digest('base64');

    return { timestamp: ts, signature, bodyString };
  }

  private buildHeaders({ timestamp, signature }: { timestamp: string; signature: string }, apiKey: string) {
    return {
      'X-API-Key': apiKey,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };
  }

  private async request(path: string, method: 'GET' | 'POST', body?: unknown) {
    const { apiKey, baseUrl } = await this.getConfig();
    const { timestamp, signature, bodyString } = this.signRequest(method, path, body, apiKey);
    const headers = this.buildHeaders({ timestamp, signature }, apiKey);

    try {
      const response = await axios({
        url: `${baseUrl}${path}`,
        method,
        headers,
        data: bodyString || undefined,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        throw new Error(`Payment API error: ${errorDetails}`);
      }
      throw error;
    }
  }

  async createTransactionQRIS({ amount, refId, customer, products, note = 'VPN Order', expiresInMinutes = 60 }: { amount: number, refId: string, customer: { name: string, email: string, phone: string }, products: Array<{ product_name: string, product_code: string, product_url: string, product_thumbnail: string }>, note?: string, expiresInMinutes?: number }) {
    const { merchantId } = await this.getConfig();
    const path = '/v1/api/transactions';
    const body = {
      merchant_id: merchantId,
      channel_code: 'QRIS',
      amount,
      ref_id: refId,
      notify_url: `${config.APP_URL ? config.APP_URL.replace(/\/$/, '') : 'https://[DOMAIN-BOT-ANDA]'}/api/webhook/payment`,
      fee_direction: 'merchant',
      note,
      expires_in_minutes: expiresInMinutes,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      metadata: products
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
