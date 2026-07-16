import { Bot, InputFile } from 'grammy';
import { MyContext } from '../index';
import { prisma } from '../../db/client';
import { mainKeyboard } from "../keyboards/main.keyboard"
import { serverKeyboard } from '../keyboards/server.keyboard';
import { packageKeyboard } from '../keyboards/package.keyboard';
import { confirmKeyboard } from '../keyboards/confirm.keyboard';
import { paymentService } from '../../services/payment.service';
import { generateQrCode } from '../../services/qrcode.service';
import { buildStartMessage } from "../messages/start.message"

export const registerOrderHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:buy', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => { });
    const servers = await prisma.server.findMany({ where: { isActive: true } });
    const text = ctx.t('order_choose_server');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: serverKeyboard(ctx.t, servers) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: serverKeyboard(ctx.t, servers) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:server:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => { });
    const serverId = Number(ctx.match[1]);
    const packages = await prisma.package.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!server) return ctx.answerCallbackQuery(ctx.t('error_data_not_found'));

    const text = ctx.t('order_choose_package', { serverFlag: server.flag, serverRegion: server.region, serverName: server.name });

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: packageKeyboard(ctx.t, packages, serverId) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: packageKeyboard(ctx.t, packages, serverId) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:package:(\d+):(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => { });
    const packageId = Number(ctx.match[1]);
    const serverId = Number(ctx.match[2]);

    if (!ctx.from) return;

    const user = await prisma.user.findUnique({ where: { telegramId: ctx.from.id } });
    if (!user) return ctx.answerCallbackQuery(ctx.t('error_user_not_found'));

    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    const server = await prisma.server.findUnique({ where: { id: serverId } });

    if (!pkg || !server) return ctx.answerCallbackQuery(ctx.t('error_data_not_found'));

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        packageId: pkg.id,
        serverId: server.id,
        amount: pkg.price,
        status: 'PENDING'
      }
    });

    const text = ctx.t('order_confirm', { serverFlag: server.flag, serverRegion: server.region, pkgName: pkg.name, pkgPrice: pkg.price.toLocaleString('id-ID') });

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: confirmKeyboard(ctx.t, order.id) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: confirmKeyboard(ctx.t, order.id) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:pay:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => { });
    const orderId = Number(ctx.match[1]);
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, package: true } });

    if (!order) return ctx.answerCallbackQuery(ctx.t('error_data_not_found'));

    try {
      const refId = `ORD-${Date.now()}-${order.id}`;
      const paymentRes = await paymentService.createTransactionQRIS({
        amount: order.amount,
        refId,
        customer: { name: order.user.fullName, email: 'admin@yggdrasil.com', phone: '081234567890' },
        products: [{ product_thumbnail: 'https://xoftware.id/thumbnail.jpg', product_name: order.package.name, product_code: `pack-${order.packageId}`, product_url: 'https://xoftware.id' }]
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: refId, qrImageUrl: paymentRes.data?.qr_image_url }
      });

      const qrUrl = paymentRes.data?.qr_image_url;
      const qrisText = paymentRes.data?.qris_text;
      const text = ctx.t('order_qr_ready', { refId, amount: order.amount.toLocaleString('id-ID') });

      if (qrUrl) {
        await ctx.replyWithPhoto(qrUrl, { caption: text, parse_mode: 'HTML' });
        await ctx.deleteMessage().catch(() => { });
      } else if (qrisText) {
        const qrBuffer = await generateQrCode(qrisText);
        await ctx.replyWithPhoto(new InputFile(qrBuffer), { caption: text, parse_mode: 'HTML' });
        await ctx.deleteMessage().catch(() => { });
      } else {
        await ctx.reply(text, { parse_mode: 'HTML' });
      }

    } catch (error: unknown) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : String(error);
      await ctx.reply(`❌ ${ctx.t('order_qr_failed')}\n<i>${errMsg}</i>`, { parse_mode: 'HTML' }).catch(() => { });
    }
  });

  bot.callbackQuery('menu:main', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => { });
    const name = ctx.from?.first_name ?? 'Kawan';

    const text = buildStartMessage(ctx.t, name);
    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: mainKeyboard(ctx.t) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: mainKeyboard(ctx.t) }).catch(() => { });
    });
  });

  bot.callbackQuery(/^order:cancel:(\d+)$/, async (ctx) => {
    const orderId = Number(ctx.match[1]);
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
    await ctx.answerCallbackQuery(ctx.t('order_cancel')).catch(() => { });
    const name = ctx.from?.first_name ?? 'Kawan';
    const text = buildStartMessage(ctx.t, name);
    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: mainKeyboard(ctx.t) }).catch(async () => {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: mainKeyboard(ctx.t) }).catch(() => { });
    });
  });
};
