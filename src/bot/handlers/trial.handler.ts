import { Bot, Context, InputFile } from 'grammy';
import { prisma } from '../../db/client';
import { wireguardService } from '../../services/wireguard.service';
import { generateQrCode } from '../../services/qrcode.service';
import { getDynamicConfig } from '../../utils/config.util';

export const registerTrialHandler = (bot: Bot<Context>) => {
  bot.callbackQuery('menu:trial', async (ctx) => {
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id }, include: { vpnAccounts: true } });
    
    if (!user) return ctx.answerCallbackQuery('User tidak ditemukan!');

    const hasTrial = user.vpnAccounts.some(acc => acc.isTrial);
    if (hasTrial) {
      const text = `😅  <b>Ups, kamu udah pernah trial nih!</b>\n\nTapi tenang, paket berbayar kita\nterjangkau banget lho! 😉`;
      const { InlineKeyboard } = require('grammy');
      const kb = new InlineKeyboard().text('🛒 Beli Sekarang', 'menu:buy').row().text('🏠 Menu Utama', 'menu:main');
      await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
         await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
      });
      return;
    }

    const servers = await prisma.server.findMany({ where: { isActive: true } });
    const text = `🎁  <b>Trial Gratis!</b>\n\nPilih lokasi server untuk trial kamu! ⚡`;
    const { InlineKeyboard } = require('grammy');
    const kb = new InlineKeyboard();
    servers.forEach((server) => {
      kb.text(`${server.flag} ${server.region} ${server.name}`, `trial:server:${server.id}`).row();
    });
    kb.text('← Kembali / Back', 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });

  bot.callbackQuery(/^trial:server:(\d+)$/, async (ctx) => {
    const serverId = Number(ctx.match[1]);
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    if (!user || !server) return ctx.answerCallbackQuery('Data tidak ditemukan!');

    try {
      await ctx.editMessageCaption({ caption: '⏳ Memproses akun trial Anda...', parse_mode: 'HTML' }).catch(async () => {
         await ctx.editMessageText('⏳ Memproses akun trial Anda...').catch(() => {});
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
      const text = `🎉  <b>Trial Berhasil Dibuat!</b>\n\nAktif s/d: ${activeUntil.toLocaleDateString()}\nServer: ${server.flag} ${server.name}\n\nSilakan scan QR di atas atau gunakan file .conf berikut.`;

      await ctx.deleteMessage().catch(() => {});
      await ctx.replyWithPhoto(new InputFile(qrBuffer, 'qr.png'), { caption: text, parse_mode: 'HTML' });
      await ctx.replyWithDocument(new InputFile(Buffer.from(wgConfig.configFile), `${peerName}.conf`));

    } catch (err: any) {
      await ctx.reply(`Gagal membuat trial: ${err.message}`);
    }
  });
};
