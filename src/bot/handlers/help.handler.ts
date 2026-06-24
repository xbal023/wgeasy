import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from '../index';
import { config } from '../../config';

export const registerHelpHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:help', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    
    const adminLinks = config.ADMIN_TELEGRAM_IDS
      .map((id, index) => `👨‍💻 <a href="tg://user?id=${id}">Admin ${index + 1}</a>`)
      .join('\n');

    const text = ctx.t('help_text', { AdminUsername: adminLinks });
    const kb = new InlineKeyboard().text(ctx.t('btn_back_main'), 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });
};
