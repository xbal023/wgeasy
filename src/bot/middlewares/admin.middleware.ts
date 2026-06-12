import { NextFunction } from 'grammy';
import { config } from '../../config';
import { MyContext } from '../index';

export const adminMiddleware = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.from) return;

  const adminIds = config.ADMIN_TELEGRAM_IDS;
  const userId = ctx.from.id;

  if (adminIds.includes(userId)) {
    await next();
  } else {
    await ctx.reply(ctx.t('error_no_access'));
  }
};
