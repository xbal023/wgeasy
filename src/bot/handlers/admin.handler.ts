import { Bot, InlineKeyboard } from 'grammy';
import { prisma } from '../../db/client';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { adminKeyboard, adminSettingsKeyboard } from '../keyboards/admin.keyboard';
import { logger } from '../../utils/logger';
import { MyContext } from '../index';

const adminState = new Map<number, { action: string; data?: unknown }>();

export const registerAdminHandler = (bot: Bot<MyContext>) => {

  bot.command('admin', adminMiddleware, async (ctx) => {
    adminState.delete(ctx.from!.id);
    const text = `👨‍💻 <b>Admin Panel</b>\n\nSelamat datang, Master! Pilih menu di bawah ini:`;
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) });
  });

  bot.callbackQuery('admin:stats', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const totalUsers = await prisma.user.count();
    const activeVpn = await prisma.vpnAccount.count({ where: { isSuspended: false } });
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const revenueAggr = await prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { amount: true } });
    const totalRevenueAggr = await prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } });
    const revenueBulanIni = revenueAggr._sum.amount || 0;
    const totalRevenue = totalRevenueAggr._sum.amount || 0;
    const text = ctx.t('admin_stats', { totalUsers, activeVpn, revenueMonth: revenueBulanIni.toLocaleString('id-ID'), revenueTotal: totalRevenue.toLocaleString('id-ID') });
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) }).catch(() => {});
  });

  bot.callbackQuery('admin:broadcast', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.set(ctx.from!.id, { action: 'broadcast' });
    const kb = new InlineKeyboard().text('❌ Batal', 'admin:cancel_action');
    await ctx.editMessageText('📢 <b>Broadcast</b>\n\nKirimkan pesan yang ingin di-broadcast ke SEMUA user.\nMendukung teks, gambar, video, dan file.\n\nTekan tombol Batal untuk membatalkan.', { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
  });

  bot.callbackQuery('admin:packages', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const packages = await prisma.package.findMany({ orderBy: { id: 'asc' } });
    let text = '📦 <b>Kelola Paket VPN</b>\n\n';
    if (packages.length === 0) {
      text += '<i>Belum ada paket. Tambahkan paket baru!</i>';
    } else {
      packages.forEach((pkg, i) => {
        const status = pkg.isActive ? '✅' : '❌';
        text += `${i + 1}. ${status} <b>${pkg.name}</b>\n   ${pkg.durationDay} hari • Rp ${pkg.price.toLocaleString('id-ID')} • ${pkg.maxDevices} device\n\n`;
      });
    }
    const kb = new InlineKeyboard();
    packages.forEach((pkg) => {
      kb.text(`${pkg.isActive ? '❌' : '✅'} ${pkg.name}`, `admin:pkg_toggle:${pkg.id}`)
        .text(`🗑 Hapus`, `admin:pkg_del:${pkg.id}`).row();
    });
    kb.text('➕ Tambah Paket', 'admin:pkg_add').row();
    kb.text('🔙 Kembali', 'admin:main');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
  });

  bot.callbackQuery('admin:pkg_add', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.set(ctx.from!.id, { action: 'pkg_add' });
    const kb = new InlineKeyboard().text('❌ Batal', 'admin:cancel_action');
    await ctx.editMessageText(
      '➕ <b>Tambah Paket Baru</b>\n\nKirim data paket dengan format:\n\n<code>NamaPaket|Durasi(hari)|Harga|MaxDevice</code>\n\nContoh:\n<code>Weekly|7|10000|1</code>\n<code>Monthly|30|25000|2</code>',
      { parse_mode: 'HTML', reply_markup: kb }
    ).catch(() => {});
  });

  bot.callbackQuery(/^admin:pkg_toggle:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const pkgId = Number(ctx.match[1]);
    const pkg = await prisma.package.findUnique({ where: { id: pkgId } });
    if (!pkg) return;
    await prisma.package.update({ where: { id: pkgId }, data: { isActive: !pkg.isActive } });
    await refreshPackageList(ctx);
  });

  bot.callbackQuery(/^admin:pkg_del:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const pkgId = Number(ctx.match[1]);
    const kb = new InlineKeyboard()
      .text('✅ Ya, Hapus', `admin:pkg_del_confirm:${pkgId}`)
      .text('❌ Batal', 'admin:packages');
    await ctx.editMessageText(`⚠️ <b>Konfirmasi Hapus</b>\n\nYakin ingin menghapus paket #${pkgId}?`, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
  });

  bot.callbackQuery(/^admin:pkg_del_confirm:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery('✅ Paket dihapus').catch(() => {});
    const pkgId = Number(ctx.match[1]);
    await prisma.package.delete({ where: { id: pkgId } }).catch(() => {});
    await refreshPackageList(ctx);
  });

  bot.callbackQuery('admin:servers', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const servers = await prisma.server.findMany({ orderBy: { id: 'asc' } });
    let text = '🌍 <b>Kelola Server VPN</b>\n\n';
    if (servers.length === 0) {
      text += '<i>Belum ada server. Tambahkan server baru!</i>';
    } else {
      servers.forEach((srv, i) => {
        const status = srv.isActive ? '✅' : '❌';
        text += `${i + 1}. ${status} ${srv.flag} <b>${srv.name}</b> — ${srv.region}\n   Host: <code>${srv.host}</code>\n   API: <code>${srv.apiUrl}</code>\n   Max Peers: ${srv.maxPeers}\n\n`;
      });
    }
    const kb = new InlineKeyboard();
    servers.forEach((srv) => {
      kb.text(`${srv.isActive ? '❌' : '✅'} ${srv.flag} ${srv.name}`, `admin:srv_toggle:${srv.id}`)
        .text(`🗑 Hapus`, `admin:srv_del:${srv.id}`).row();
    });
    kb.text('➕ Tambah Server', 'admin:srv_add').row();
    kb.text('🔙 Kembali', 'admin:main');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
  });

  bot.callbackQuery('admin:srv_add', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.set(ctx.from!.id, { action: 'srv_add' });
    const kb = new InlineKeyboard().text('❌ Batal', 'admin:cancel_action');
    await ctx.editMessageText(
      '➕ <b>Tambah Server Baru</b>\n\nKirim data server dengan format:\n\n<code>Nama|Region|Flag|Host|ApiUrl|ApiPassword|MaxPeers</code>\n\nContoh:\n<code>SG-1|Singapore|🇸🇬|vpn-sg.domain.com|http://localhost:51821|password123|50</code>',
      { parse_mode: 'HTML', reply_markup: kb }
    ).catch(() => {});
  });

  bot.callbackQuery(/^admin:srv_toggle:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const srvId = Number(ctx.match[1]);
    const srv = await prisma.server.findUnique({ where: { id: srvId } });
    if (!srv) return;
    await prisma.server.update({ where: { id: srvId }, data: { isActive: !srv.isActive } });
    await refreshServerList(ctx);
  });

  bot.callbackQuery(/^admin:srv_del:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const srvId = Number(ctx.match[1]);
    const kb = new InlineKeyboard()
      .text('✅ Ya, Hapus', `admin:srv_del_confirm:${srvId}`)
      .text('❌ Batal', 'admin:servers');
    await ctx.editMessageText(`⚠️ <b>Konfirmasi Hapus</b>\n\nYakin ingin menghapus server #${srvId}?`, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
  });

  bot.callbackQuery(/^admin:srv_del_confirm:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery('✅ Server dihapus').catch(() => {});
    const srvId = Number(ctx.match[1]);
    await prisma.server.delete({ where: { id: srvId } }).catch(() => {});
    await refreshServerList(ctx);
  });

  bot.callbackQuery('admin:settings', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
    const isGateActive = isGateActiveStr === 'true';
    const text = ctx.t('admin_settings');
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminSettingsKeyboard(ctx.t, isGateActive) }).catch(() => {});
  });

  bot.callbackQuery('admin:toggle_gate', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
    const isGateActive = isGateActiveStr === 'true';
    const newValue = (!isGateActive).toString();
    await prisma.botConfig.upsert({ where: { key: 'gate_active' }, update: { value: newValue }, create: { key: 'gate_active', value: newValue } });
    await ctx.editMessageReplyMarkup({ reply_markup: adminSettingsKeyboard(ctx.t, !isGateActive) }).catch(() => {});
  });

  bot.callbackQuery('admin:cancel_action', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.delete(ctx.from!.id);
    const text = `👨‍💻 <b>Admin Panel</b>\n\nSelamat datang, Master! Pilih menu di bawah ini:`;
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) }).catch(() => {});
  });

  bot.callbackQuery('admin:main', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.delete(ctx.from!.id);
    const text = `👨‍💻 <b>Admin Panel</b>\n\nSelamat datang, Master! Pilih menu di bawah ini:`;
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminKeyboard(ctx.t) }).catch(() => {});
  });

  bot.on('message', async (ctx, next) => {
    if (!ctx.from) return next();
    const state = adminState.get(ctx.from.id);
    if (!state) return next();

    if (state.action === 'broadcast') {
      adminState.delete(ctx.from.id);
      const users = await prisma.user.findMany({ select: { telegramId: true } });
      await ctx.reply(`📢 Broadcasting ke ${users.length} users di background...`);

      const messageId = ctx.message?.message_id;
      const fromChatId = ctx.chat?.id;
      const api = ctx.api;

      if (messageId && fromChatId) {
        (async () => {
          let success = 0, failed = 0;
          for (const user of users) {
            try {
              await api.copyMessage(Number(user.telegramId), fromChatId, messageId);
              success++;
            } catch { failed++; }
            await new Promise(res => setTimeout(res, 50));
          }
          try {
            await api.sendMessage(fromChatId, `✅ Broadcast Selesai!\n\n✓ Berhasil: ${success}\n✗ Gagal: ${failed}`);
          } catch (e) { logger.error('Broadcast report error: ' + e); }
        })();
      }
      return;
    }

    if (state.action === 'pkg_add' && ctx.message?.text) {
      adminState.delete(ctx.from.id);
      const parts = ctx.message.text.split('|').map(s => s.trim());
      if (parts.length < 4) {
        await ctx.reply('❌ Format salah! Gunakan:\n<code>Nama|Durasi|Harga|MaxDevice</code>', { parse_mode: 'HTML' });
        return;
      }
      const [name, durationStr, priceStr, devicesStr] = parts;
      const durationDay = parseInt(durationStr);
      const price = parseInt(priceStr);
      const maxDevices = parseInt(devicesStr) || 1;

      if (!name || isNaN(durationDay) || isNaN(price)) {
        await ctx.reply('❌ Data tidak valid! Pastikan durasi dan harga berupa angka.');
        return;
      }

      await prisma.package.create({ data: { name, durationDay, price, maxDevices } });
      await ctx.reply(`✅ Paket <b>${name}</b> berhasil ditambahkan!\n\n📅 ${durationDay} hari\n💰 Rp ${price.toLocaleString('id-ID')}\n📱 ${maxDevices} device\n\nKetik /admin untuk kembali.`, { parse_mode: 'HTML' });
      return;
    }

    if (state.action === 'srv_add' && ctx.message?.text) {
      adminState.delete(ctx.from.id);
      const parts = ctx.message.text.split('|').map(s => s.trim());
      if (parts.length < 7) {
        await ctx.reply('❌ Format salah! Gunakan:\n<code>Nama|Region|Flag|Host|ApiUrl|ApiPassword|MaxPeers</code>', { parse_mode: 'HTML' });
        return;
      }
      const [name, region, flag, host, apiUrl, apiPassword, maxPeersStr] = parts;
      const maxPeers = parseInt(maxPeersStr) || 50;

      await prisma.server.create({ data: { name, region, flag, host, apiUrl, apiPassword, maxPeers } });
      await ctx.reply(`✅ Server <b>${flag} ${name}</b> berhasil ditambahkan!\n\n🌍 ${region}\n🔗 ${host}\n🔌 ${apiUrl}\n👥 Max ${maxPeers} peers\n\nKetik /admin untuk kembali.`, { parse_mode: 'HTML' });
      return;
    }

    return next();
  });
};

async function refreshPackageList(ctx: MyContext) {
  const packages = await prisma.package.findMany({ orderBy: { id: 'asc' } });
  let text = '📦 <b>Kelola Paket VPN</b>\n\n';
  if (packages.length === 0) {
    text += '<i>Belum ada paket.</i>';
  } else {
    packages.forEach((pkg, i) => {
      const status = pkg.isActive ? '✅' : '❌';
      text += `${i + 1}. ${status} <b>${pkg.name}</b>\n   ${pkg.durationDay} hari • Rp ${pkg.price.toLocaleString('id-ID')} • ${pkg.maxDevices} device\n\n`;
    });
  }
  const kb = new InlineKeyboard();
  packages.forEach((pkg) => {
    kb.text(`${pkg.isActive ? '❌' : '✅'} ${pkg.name}`, `admin:pkg_toggle:${pkg.id}`)
      .text(`🗑 Hapus`, `admin:pkg_del:${pkg.id}`).row();
  });
  kb.text('➕ Tambah Paket', 'admin:pkg_add').row();
  kb.text('🔙 Kembali', 'admin:main');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}

async function refreshServerList(ctx: MyContext) {
  const servers = await prisma.server.findMany({ orderBy: { id: 'asc' } });
  let text = '🌍 <b>Kelola Server VPN</b>\n\n';
  if (servers.length === 0) {
    text += '<i>Belum ada server.</i>';
  } else {
    servers.forEach((srv, i) => {
      const status = srv.isActive ? '✅' : '❌';
      text += `${i + 1}. ${status} ${srv.flag} <b>${srv.name}</b> — ${srv.region}\n   Host: <code>${srv.host}</code>\n   API: <code>${srv.apiUrl}</code>\n   Max Peers: ${srv.maxPeers}\n\n`;
    });
  }
  const kb = new InlineKeyboard();
  servers.forEach((srv) => {
    kb.text(`${srv.isActive ? '❌' : '✅'} ${srv.flag} ${srv.name}`, `admin:srv_toggle:${srv.id}`)
      .text(`🗑 Hapus`, `admin:srv_del:${srv.id}`).row();
  });
  kb.text('➕ Tambah Server', 'admin:srv_add').row();
  kb.text('🔙 Kembali', 'admin:main');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}
