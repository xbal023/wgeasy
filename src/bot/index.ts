import { Bot, Context, session, SessionFlavor } from 'grammy';
import { type ConversationFlavor, conversations } from '@grammyjs/conversations';
import { config } from '../config';
import { logger } from '../utils/logger';
import { registerStartHandler } from './handlers/start.handler';
import { registerOrderHandler } from './handlers/order.handler';
import { registerTrialHandler } from './handlers/trial.handler';
import { registerReferralHandler } from './handlers/referral.handler';
import { registerAdminHandler } from './handlers/admin.handler';

export type MyContext = Context & SessionFlavor<{}> & ConversationFlavor<Context>;

export const startBot = async () => {
  const bot = new Bot<MyContext>(config.BOT_TOKEN);

  bot.catch((err) => {
    logger.error(`Bot error: ${err.message}`);
  });

  bot.use(session({ initial: () => ({}) }));
  bot.use(conversations());

  registerStartHandler(bot as any);
  registerOrderHandler(bot as any);
  registerTrialHandler(bot as any);
  registerReferralHandler(bot as any);
  registerAdminHandler(bot as any);

  logger.info('Bot starting...');
  await bot.start();
};
