import { Bot, Context, session, SessionFlavor } from 'grammy';
import { TranslationKey } from '../i18n';
import { type ConversationFlavor, conversations } from '@grammyjs/conversations';
import { config } from '../config';
import { logger } from '../utils/logger';
import { registerStartHandler } from './handlers/start.handler';
import { registerOrderHandler } from './handlers/order.handler';
import { registerTrialHandler } from './handlers/trial.handler';
import { registerReferralHandler } from './handlers/referral.handler';
import { registerAdminHandler } from './handlers/admin.handler';
import { registerLanguageHandler } from './handlers/language.handler';
import { i18nMiddleware } from './middlewares/i18n.middleware';

export type MyContext = Context & SessionFlavor<{ lang: string }> & ConversationFlavor<Context> & { t: (key: TranslationKey, params?: Record<string, string | number>) => string };

export const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.catch((err) => {
  logger.error(`Bot error: ${err.message}`);
});

bot.use(session({ initial: () => ({ lang: '' }) }));
bot.use(i18nMiddleware);
bot.use(conversations());

registerStartHandler(bot as any);
registerOrderHandler(bot as any);
registerTrialHandler(bot as any);
registerReferralHandler(bot as any);
registerAdminHandler(bot as any);
registerLanguageHandler(bot as any);

export const startBot = async () => {
  logger.info('Setting up bot webhook...');
  await bot.api.setWebhook(`${config.APP_URL}/api/bot-webhook`);
};
