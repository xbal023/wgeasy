import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from '../index';

export const registerLanguageHandler = (bot: Bot<MyContext>) => {
  bot.command('lang', async (ctx) => {
    const kb = new InlineKeyboard()
      .text('🇮🇩 Bahasa Indonesia', 'lang:id')
      .text('🇬🇧 English', 'lang:en');

    await ctx.reply('Pilih bahasa / Choose your language:', { reply_markup: kb });
  });

  bot.callbackQuery(/^lang:(id|en)$/, async (ctx) => {
    const lang = ctx.match[1];
    ctx.session.lang = lang;
    await ctx.answerCallbackQuery(ctx.t('lang_changed')).catch(() => {});
    await ctx.editMessageText(ctx.t('lang_changed'));
  });
};
