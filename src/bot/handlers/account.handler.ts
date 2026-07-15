import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { MyContext } from '../index';
import { prisma } from '../../db/client';

export const registerAccountHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:account', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id },
      include: {
        vpnAccounts: {
          include: { server: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || user.vpnAccounts.length === 0) {
      const kb = new InlineKeyboard()
        .text(ctx.t('btn_buy_now'), 'menu:buy').row()
        .text(ctx.t('btn_back_main'), 'menu:main');
      
      const text = ctx.t('account_empty');
      await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
      });
      return;
    }

    let accountsInfo = '';
    const kb = new InlineKeyboard();

    user.vpnAccounts.forEach((acc, idx) => {
      const status = acc.isSuspended ? '❌ Suspended' : (acc.activeUntil.getTime() < Date.now() ? '⏳ Expired' : '✅ Active');
      const dateStr = acc.activeUntil.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
      
      accountsInfo += `${idx + 1}. ${acc.server.flag} ${acc.server.name} — ${status}\n`;
      accountsInfo += `   IP: <code>${acc.assignedIp}</code>\n`;
      accountsInfo += `   Exp: ${dateStr}\n\n`;

      if (!acc.isSuspended && acc.activeUntil.getTime() > Date.now()) {
        kb.text(ctx.t('btn_download_config', { id: acc.id }), `account:dl_config:${acc.id}`).row();
      }
    });

    kb.text(ctx.t('btn_back_main'), 'menu:main');

    const text = ctx.t('account_list', { accountsInfo });
    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });

  bot.callbackQuery(/^account:dl_config:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const accId = Number(ctx.match[1]);

    const acc = await prisma.vpnAccount.findUnique({
      where: { id: accId },
      include: { server: true, user: true }
    });

    if (!acc || acc.user.telegramId !== BigInt(ctx.from!.id)) {
      return ctx.reply(ctx.t('error_data_not_found'));
    }

    if (acc.isSuspended || acc.activeUntil.getTime() < Date.now()) {
      return ctx.reply('⛔ Akun VPN sudah tidak aktif.');
    }

    const buffer = Buffer.from(acc.configFile, 'utf-8');
    await ctx.replyWithDocument(
      new InputFile(buffer, `${acc.peerName}.conf`),
      { caption: `✅ Konfigurasi WireGuard untuk ${acc.server.flag} ${acc.server.name}` }
    );
  });
};
