import { Context, NextFunction } from 'grammy';
import { config } from '../../config';

export const adminMiddleware = async (ctx: Context, next: NextFunction) => {
  if (!ctx.from) return;

  const adminIds = config.ADMIN_TELEGRAM_IDS;
  const userId = ctx.from.id;

  if (adminIds.includes(userId)) {
    await next();
  } else {
    await ctx.reply('⛔ Anda tidak memiliki akses ke fitur ini.');
  }
};
