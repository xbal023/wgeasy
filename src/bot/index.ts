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
import { registerAccountHandler } from './handlers/account.handler';
import { registerHelpHandler } from './handlers/help.handler';
import { i18nMiddleware } from './middlewares/i18n.middleware';

export type MyContext = Context & SessionFlavor<{ lang: string }> & ConversationFlavor<Context> & { t: (key: TranslationKey, params?: Record<string, string | number>) => string };

export const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.catch((err) => {
  logger.error(`Bot error: ${err.message}`);
});

bot.use(session({ initial: () => ({ lang: '' }) }));
bot.use(i18nMiddleware);
bot.use(conversations());

registerStartHandler(bot);
registerOrderHandler(bot);
registerTrialHandler(bot);
registerReferralHandler(bot);
registerAdminHandler(bot);
registerLanguageHandler(bot);
registerAccountHandler(bot);
registerHelpHandler(bot);

export const startBot = async () => {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Buka Menu Utama' },
    { command: 'lang', description: 'Ganti Bahasa / Change Language' },
    { command: 'admin', description: 'Buka Panel Admin (Khusus Admin)' }
  ]).catch(err => logger.error(`Failed to set commands: ${err.message}`));

  if (config.USE_WEBHOOK === 'true') {
    logger.info('Setting up bot webhook...');
    try {
      await bot.api.setWebhook(`${config.APP_URL}/api/bot-webhook`);
      logger.info('Webhook successfully set.');
    } catch (err: any) {
      logger.error(`Failed to set webhook: ${err.message}. Retrying in 60 seconds...`);
      
      const retryWebhook = async () => {
        try {
          await bot.api.setWebhook(`${config.APP_URL}/api/bot-webhook`);
          logger.info('Webhook successfully set on retry.');
        } catch (retryErr: any) {
          logger.error(`Retry failed: ${retryErr.message}. Retrying in 60 seconds...`);
          setTimeout(retryWebhook, 60000);
        }
      };
      
      setTimeout(retryWebhook, 60000);
    }
  } else {
    logger.info('Starting bot with long polling...');
    await bot.api.deleteWebhook().catch(() => {});
    bot.start({
      onStart: (botInfo) => logger.info(`Bot @${botInfo.username} started in long polling mode`)
    });
  }
};
