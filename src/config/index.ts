import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  ADMIN_TELEGRAM_IDS: z.string().transform((val) => val.split(',').map(Number)),
  DATABASE_URL: z.string().url(),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PAYMENT_API_KEY: z.string(),
  PAYMENT_WEBHOOK_SECRET: z.string(),
  PAYMENT_MERCHANT_ID: z.string(),
  PAYMENT_BASE_URL: z.string().url().default('https://payment.xoftware.id'),
  APP_URL: z.string().url(),
});

export const config = envSchema.parse(process.env);
