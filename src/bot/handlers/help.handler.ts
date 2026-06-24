import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from '../index';

export const registerHelpHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:help', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    
    const text = ctx.t('help_text');
    const kb = new InlineKeyboard().text(ctx.t('btn_back_main'), 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });
};
