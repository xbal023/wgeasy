import { NextFunction } from 'grammy';
import { MyContext } from '../index';
import { t, TranslationKey } from '../../i18n';
import { prisma } from '../../db/client';

export const i18nMiddleware = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.session.lang && ctx.from) {
    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    if (user && user.lang) {
      ctx.session.lang = user.lang;
    }
  }

  ctx.t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return t(ctx.session.lang, key, params);
  };

  await next();
};
