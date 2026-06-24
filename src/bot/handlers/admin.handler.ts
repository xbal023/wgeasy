import { Bot, Context, session } from 'grammy';
import { type Conversation, createConversation } from '@grammyjs/conversations';
import { prisma } from '../../db/client';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { adminKeyboard, adminSettingsKeyboard } from '../keyboards/admin.keyboard';
import { logger } from '../../utils/logger';
import { MyContext } from '../index';

type MyConversation = Conversation<MyContext>;

async function broadcastConversation(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(ctx.t('admin_broadcast_prompt'));

  const responseCtx = await conversation.wait();

  if (responseCtx.message?.text === '/cancel') {
    await ctx.reply(ctx.t('admin_broadcast_cancel'));
    return;
  }

  const users = await conversation.external(() => prisma.user.findMany({ select: { telegramId: true } }));

  await ctx.reply(ctx.t('admin_broadcast_executing', { userCount: users.length }));

  const messageId = responseCtx.message?.message_id;
  const fromChatId = responseCtx.chat?.id;
  const api = ctx.api;

  if (messageId && fromChatId) {
    // Jalankan asinkron tanpa await agar berjalan di background
    (async () => {
      let success = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await api.copyMessage(Number(user.telegramId), fromChatId, messageId);
          success++;
        } catch (err) {
          failed++;
        }
        // Jeda 50ms (rate limit aman Telegram ~30 msg/sec)
        await new Promise(res => setTimeout(res, 50));
      }

      try {
        await api.sendMessage(fromChatId, `✅ Laporan Broadcast Background Selesai!\n\nBerhasil Terkirim: ${success}\nGagal: ${failed}`);
      } catch (e) {
        logger.error('Failed to send broadcast report: ' + e);
      }
    })();
  }
}

export const registerAdminHandler = (bot: Bot<MyContext>) => {
  bot.use(createConversation(broadcastConversation as any));

  bot.command('admin', adminMiddleware, async (ctx) => {
    const text = `👨‍💻 <b>Admin Panel</b>\n\nSelamat datang, Master! Pilih menu di bawah ini:`;
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) });
  });

  bot.callbackQuery('admin:stats', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const totalUsers = await prisma.user.count();
    const activeVpn = await prisma.vpnAccount.count({ where: { isSuspended: false } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const revenueAggr = await prisma.order.aggregate({
      where: { status: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { amount: true }
    });

    const totalRevenueAggr = await prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    const revenueBulanIni = revenueAggr._sum.amount || 0;
    const totalRevenue = totalRevenueAggr._sum.amount || 0;

    const text = ctx.t('admin_stats', { totalUsers, activeVpn, revenueMonth: revenueBulanIni.toLocaleString('id-ID'), revenueTotal: totalRevenue.toLocaleString('id-ID') });

    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) }).catch(() => { });
  });

  bot.callbackQuery('admin:broadcast', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.conversation.enter('broadcastConversation');
  });

  bot.callbackQuery('admin:settings', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
    const isGateActive = isGateActiveStr === 'true';

    const text = ctx.t('admin_settings');

    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminSettingsKeyboard(ctx.t, isGateActive) }).catch(() => { });
  });

  bot.callbackQuery('admin:toggle_gate', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
    const isGateActive = isGateActiveStr === 'true';
    const newValue = (!isGateActive).toString();

    await prisma.botConfig.upsert({
      where: { key: 'gate_active' },
      update: { value: newValue },
      create: { key: 'gate_active', value: newValue }
    });

    await ctx.editMessageReplyMarkup({ reply_markup: adminSettingsKeyboard(ctx.t, !isGateActive) }).catch(() => { });
  });

  bot.callbackQuery('admin:main', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const text = `👨‍💻 <b>Admin Panel</b>\n\nSelamat datang, Master! Pilih menu di bawah ini:`;
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) }).catch(() => { });
  });
};
