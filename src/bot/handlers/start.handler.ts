import { Bot, InputFile } from 'grammy';
import { MyContext } from '../index';
import { gateMiddleware } from '../middlewares/gate.middleware';
import { buildStartMessage } from '../messages/start.message';
import { mainKeyboard } from '../keyboards/main.keyboard';
import { prisma } from '../../db/client';

export const registerStartHandler = (bot: Bot<MyContext>) => {
  bot.command('start', gateMiddleware, async (ctx) => {
    if (!ctx.from) return;
    
    const textSplit = ctx.message?.text?.split(' ') || [];
    const payload = textSplit.length > 1 ? textSplit[1] : null;

    let referredById = null;
    if (payload && payload.startsWith('REF_')) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: payload } });
      if (referrer && referrer.telegramId !== BigInt(ctx.from.id)) {
        referredById = referrer.id;
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });

    await prisma.user.upsert({
      where: { telegramId: ctx.from.id },
      update: {
        username: ctx.from.username,
        fullName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ''),
      },
      create: {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        fullName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ''),
        referralCode: `REF_${ctx.from.id.toString(36).toUpperCase()}`,
        referredById: existingUser ? undefined : referredById,
      },
    });

    const name = ctx.from.first_name;
    
    try {
      await ctx.replyWithPhoto(
        new InputFile('./assets/banner.jpg'),
        {
          caption: buildStartMessage(ctx.t, name),
          parse_mode: 'HTML',
          reply_markup: mainKeyboard(ctx.t),
        }
      );
    } catch (error) {
      await ctx.reply(buildStartMessage(ctx.t, name), {
        parse_mode: 'HTML',
        reply_markup: mainKeyboard(ctx.t),
      });
    }
  });

  bot.callbackQuery('gate:recheck', gateMiddleware, async (ctx) => {
    const name = ctx.from?.first_name ?? 'Kawan';
    
    try {
        await ctx.deleteMessage();
    } catch(e) {}
    
    try {
      await ctx.replyWithPhoto(
        new InputFile('./assets/banner.jpg'),
        {
          caption: buildStartMessage(ctx.t, name),
          parse_mode: 'HTML',
          reply_markup: mainKeyboard(ctx.t),
        }
      );
    } catch (error) {
      await ctx.reply(buildStartMessage(ctx.t, name), {
        parse_mode: 'HTML',
        reply_markup: mainKeyboard(ctx.t),
      });
    }
  });
};
