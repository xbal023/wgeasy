import { NextFunction } from 'grammy';
import { MyContext } from '../index';
import { t, TranslationKey } from '../../i18n';

export const i18nMiddleware = async (ctx: MyContext, next: NextFunction) => {
  // Removed auto-fallback, requires explicit choice in /start

  ctx.t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return t(ctx.session.lang, key, params);
  };

  await next();
};
