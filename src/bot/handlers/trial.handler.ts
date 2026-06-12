import { Bot, InputFile, InlineKeyboard } from 'grammy';
import { MyContext } from '../index';
import { prisma } from '../../db/client';
import { wireguardService } from '../../services/wireguard.service';
import { generateQrCode } from '../../services/qrcode.service';
import { getDynamicConfig } from '../../utils/config.util';

export const registerTrialHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:trial', async (ctx) => {
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id }, include: { vpnAccounts: true } });

    if (!user) return ctx.answerCallbackQuery(ctx.t('error_user_not_found'));

    const hasTrial = user.vpnAccounts.some(acc => acc.isTrial);
    if (hasTrial) {
      const text = ctx.t('trial_already_used');
      const kb = new InlineKeyboard().text(ctx.t('btn_buy_now'), 'menu:buy').row().text(ctx.t('btn_back_main'), 'menu:main');
      await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => { });
      });
      return;
    }

    const servers = await prisma.server.findMany({ where: { isActive: true } });
    const text = ctx.t('trial_choose_server');
    const kb = new InlineKeyboard();
    servers.forEach((server) => {
      kb.text(`${server.flag} ${server.region} ${server.name}`, `trial:server:${server.id}`).row();
    });
    kb.text(ctx.t('btn_back'), 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => { });
    });
  });

  bot.callbackQuery(/^trial:server:(\d+)$/, async (ctx) => {
    const serverId = Number(ctx.match[1]);
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!user || !server) return ctx.answerCallbackQuery(ctx.t('error_data_not_found'));

    try {
      await ctx.editMessageCaption({ caption: ctx.t('trial_processing'), parse_mode: 'HTML' }).catch(async () => {
        await ctx.editMessageText(ctx.t('trial_processing')).catch(() => { });
      });

      const trialDaysStr = await getDynamicConfig('trial_day', '1');
      const trialDays = parseInt(trialDaysStr) || 1;
      const activeUntil = new Date();
      activeUntil.setDate(activeUntil.getDate() + trialDays);

      const peerName = `trial-${user.id}-${Date.now()}`;
      const wgConfig = await wireguardService.createPeer(server, peerName);

      const dummyPackage = await prisma.package.findFirst();
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          packageId: dummyPackage?.id || 1,
          serverId: server.id,
          amount: 0,
          status: 'ACTIVE',
          paidAt: new Date()
        }
      });

      await prisma.vpnAccount.create({
        data: {
          userId: user.id,
          orderId: order.id,
          serverId: server.id,
          peerName,
          privateKey: 'ENCRYPTED',
          publicKey: wgConfig.publicKey,
          assignedIp: wgConfig.assignedIp,
          configFile: wgConfig.configFile,
          isTrial: true,
          activeUntil
        }
      });

      const qrBuffer = await generateQrCode(wgConfig.configFile);
      const text = ctx.t('trial_success', { activeUntil: activeUntil.toLocaleDateString(), serverFlag: server.flag, serverName: server.name });

      await ctx.deleteMessage().catch(() => { });
      await ctx.replyWithPhoto(new InputFile(qrBuffer, 'qr.png'), { caption: text, parse_mode: 'HTML' });
      await ctx.replyWithDocument(new InputFile(Buffer.from(wgConfig.configFile), `${peerName}.conf`));

    } catch (err: any) {
      await ctx.reply(ctx.t('trial_failed', { error: err.message }));
    }
  });
};
