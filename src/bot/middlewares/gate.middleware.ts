import { Middleware } from 'grammy';
import { prisma } from '../../db/client';
import { buildGateMessage } from '../messages/start.message';
import { buildGateKeyboard } from '../keyboards/main.keyboard';

export const gateMiddleware: Middleware = async (ctx, next) => {
  const gateEnabled = await prisma.botConfig.findUnique({
    where: { key: 'gate_enabled' },
  });

  if (!gateEnabled || gateEnabled.value !== 'true') return next();

  const chatId = await prisma.botConfig.findUnique({
    where: { key: 'gate_chat_id' },
  });

  if (!chatId || !ctx.from) return next();

  try {
    const member = await ctx.api.getChatMember(chatId.value, ctx.from.id);
    const allowed = ['member', 'administrator', 'creator'];
    if (allowed.includes(member.status)) return next();
  } catch (error) {
    // Ignore error and show gate
  }

  const chatName = await prisma.botConfig.findUnique({
    where: { key: 'gate_chat_name' },
  });
  const chatUrl = await prisma.botConfig.findUnique({
    where: { key: 'gate_chat_url' },
  });

  const message = buildGateMessage(chatName?.value ?? 'VPN Community');
  const keyboard = buildGateKeyboard(chatUrl?.value ?? '#', ctx.callbackQuery?.id);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } else {
    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
};
