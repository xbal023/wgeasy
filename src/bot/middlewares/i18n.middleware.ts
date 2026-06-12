import { NextFunction } from 'grammy';
import { MyContext } from '../index';
import { t, TranslationKey } from '../../i18n';

export const i18nMiddleware = async (ctx: MyContext, next: NextFunction) => {
  if (!ctx.session.lang) {
    ctx.session.lang = ctx.from?.language_code === 'en' ? 'en' : 'id';
  }

  ctx.t = (key: TranslationKey, params?: Record<string, string | number>) => {
    return t(ctx.session.lang, key, params);
  };

  await next();
};
