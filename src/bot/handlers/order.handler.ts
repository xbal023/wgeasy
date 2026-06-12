import { Bot, Context } from 'grammy';
import { prisma } from '../../db/client';
import { mainKeyboard } from "../keyboards/main.keyboard"
import { serverKeyboard } from '../keyboards/server.keyboard';
import { packageKeyboard } from '../keyboards/package.keyboard';
import { confirmKeyboard } from '../keyboards/confirm.keyboard';
import { paymentService } from '../../services/payment.service';
import { buildStartMessage } from "../messages/start.message"

export const registerOrderHandler = (bot: Bot<Context>) => {
  bot.callbackQuery('menu:buy', async (ctx) => {
    const servers = await prisma.server.findMany({ where: { isActive: true } });
    const text = `🌍  <b>Pilih Server VPN</b>\n     <i>Choose your server</i>\n\nPilih lokasi yang paling dekat sama kamu\nuntuk koneksi tercepat! ⚡\n<i>Pick the closest location for best speed!</i>`;

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: serverKeyboard(servers) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: serverKeyboard(servers) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:server:(\d+)$/, async (ctx) => {
    const serverId = Number(ctx.match[1]);
    const packages = await prisma.package.findMany({ where: { isActive: true } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) return ctx.answerCallbackQuery('Server tidak ditemukan!');

    const text = `📦  <b>Pilih Paket VPN</b>\n     <i>Choose your plan</i>\n\nServer: ${server.flag} ${server.region} ${server.name}`;

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: packageKeyboard(packages, serverId) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: packageKeyboard(packages, serverId) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:package:(\d+):(\d+)$/, async (ctx) => {
    const packageId = Number(ctx.match[1]);
    const serverId = Number(ctx.match[2]);

    if (!ctx.from) return;

    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    if (!user) return ctx.answerCallbackQuery('User tidak ditemukan!');

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!pkg || !server) return ctx.answerCallbackQuery('Data tidak ditemukan!');

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        packageId: pkg.id,
        serverId: server.id,
        amount: pkg.price,
        status: 'PENDING'
      }
    });

    const text = `🧾  <b>Konfirmasi Order</b>\n     <i>Order Summary</i>\n\n┌─────────────────────────┐\n│ Server  : ${server.flag} ${server.region}\n│ Paket   : ${pkg.name}\n│ Harga   : Rp ${pkg.price.toLocaleString('id-ID')}\n│ Metode  : QRIS\n└─────────────────────────┘\n\nPastiin detailnya udah bener ya! ✅`;

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: confirmKeyboard(order.id) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: confirmKeyboard(order.id) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:pay:(\d+)$/, async (ctx) => {
    const orderId = Number(ctx.match[1]);
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, package: true } });

    if (!order) return ctx.answerCallbackQuery('Order tidak valid!');

    try {
      const refId = `ORD-${Date.now()}-${order.id}`;
      const paymentRes = await paymentService.createTransactionQRIS({
        amount: order.amount,
        refId,
        customer: { name: order.user.fullName, email: 'user@example.com', phone: '' },
        products: [{ name: order.package.name, price: order.amount, quantity: 1 }]
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: refId, qrImageUrl: paymentRes.data?.qr_image_url }
      });

      const qrUrl = paymentRes.data?.qr_image_url;
      const text = `💳  <b>Scan QR di bawah ini ya!</b>\n\nOrder ID: #${refId}\nTotal: Rp ${order.amount.toLocaleString('id-ID')}\nBerlaku: 60 menit\n\nSetelah bayar, akun VPN langsung aktif otomatis! 🚀`;

      if (qrUrl) {
        await ctx.replyWithPhoto(qrUrl, { caption: text, parse_mode: 'HTML' });
        await ctx.deleteMessage().catch(() => { });
      } else {
        await ctx.reply(text, { parse_mode: 'HTML' });
      }

    } catch (error: any) {
      console.error(error);
      ctx.answerCallbackQuery('Gagal membuat pembayaran: ' + error.message);
    }
  });

  bot.callbackQuery('menu:main', async (ctx) => {
    const name = ctx.from?.first_name ?? 'Kawan';

    const text = buildStartMessage(name);
    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: mainKeyboard() }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: mainKeyboard() }).catch(() => { });
    });
  });
};
