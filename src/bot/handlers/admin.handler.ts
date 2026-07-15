import { Bot, InlineKeyboard } from 'grammy';
import { prisma } from '../../db/client';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { adminKeyboard, adminSettingsKeyboard } from '../keyboards/admin.keyboard';
import { logger } from '../../utils/logger';
import { MyContext } from '../index';

export interface ServerBuilderData {
  id?: number;
  name?: string;
  region?: string;
  flag?: string;
  host?: string;
  apiUrl?: string;
  apiPassword?: string;
  maxPeers?: number;
  awaitingField?: 'name' | 'region' | 'flag' | 'host' | 'apiUrl' | 'apiPassword' | 'maxPeers';
}

export interface PackageBuilderData {
  id?: number;
  name?: string;
  durationDay?: number;
  price?: number;
  maxDevices?: number;
  awaitingField?: 'name' | 'durationDay' | 'price' | 'maxDevices';
}

export interface GateBuilderData {
  chatName?: string;
  chatUrl?: string;
  chatId?: string;
  awaitingField?: 'chatName' | 'chatUrl' | 'chatId';
}

export interface TrialBuilderData {
  trialDay?: number;
  awaitingField?: 'trialDay';
}

const adminState = new Map<number, { action: string; data?: any }>();

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
    await refreshPackageList(ctx);
  });

  bot.callbackQuery('admin:pkg_add', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.set(ctx.from!.id, { action: 'pkg_form', data: {} });
    await renderPackageBuilder(ctx);
  });

  bot.callbackQuery(/^admin:pkg_edit:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const pkgId = Number(ctx.match[1]);
    const pkg = await prisma.package.findUnique({ where: { id: pkgId } });
    if (!pkg) return;
    adminState.set(ctx.from!.id, { action: 'pkg_form', data: { ...pkg } });
    await renderPackageBuilder(ctx);
  });

  bot.callbackQuery(/^admin:pkg_set:(name|durationDay|price|maxDevices)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const field = ctx.match[1] as PackageBuilderData['awaitingField'];
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'pkg_form') return;
    
    (state.data as PackageBuilderData).awaitingField = field;
    await renderPackageBuilder(ctx);
  });

  bot.callbackQuery('admin:pkg_save', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'pkg_form') return;
    
    const data = state.data as PackageBuilderData;
    if (!data.name || !data.durationDay || !data.price || !data.maxDevices) {
      await ctx.answerCallbackQuery({ text: '❌ Harap lengkapi semua data sebelum menyimpan!', show_alert: true }).catch(() => {});
      return;
    }

    try {
      if (data.id) {
        await prisma.package.update({
          where: { id: data.id },
          data: {
            name: data.name, durationDay: data.durationDay,
            price: data.price, maxDevices: data.maxDevices
          }
        });
      } else {
        const lastPkg = await prisma.package.findFirst({ orderBy: { sortOrder: 'desc' } });
        const nextSortOrder = lastPkg ? lastPkg.sortOrder + 1 : 1;
        await prisma.package.create({
          data: {
            name: data.name, durationDay: data.durationDay,
            price: data.price, maxDevices: data.maxDevices,
            sortOrder: nextSortOrder
          }
        });
      }
      adminState.delete(ctx.from!.id);
      await ctx.answerCallbackQuery({ text: '✅ Paket berhasil disimpan!', show_alert: true }).catch(() => {});
      await refreshPackageList(ctx);
    } catch (err: any) {
      await ctx.answerCallbackQuery({ text: '❌ Error: ' + err.message, show_alert: true }).catch(() => {});
    }
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

  bot.callbackQuery(/^admin:pkg_up:(\d+)$/, adminMiddleware, async (ctx) => {
    const pkgId = Number(ctx.match[1]);
    const pkg = await prisma.package.findUnique({ where: { id: pkgId } });
    if (!pkg) return;
    const prevPkg = await prisma.package.findFirst({
      where: { sortOrder: { lt: pkg.sortOrder } },
      orderBy: { sortOrder: 'desc' }
    });
    if (prevPkg) {
      await prisma.$transaction([
        prisma.package.update({ where: { id: pkg.id }, data: { sortOrder: prevPkg.sortOrder } }),
        prisma.package.update({ where: { id: prevPkg.id }, data: { sortOrder: pkg.sortOrder } })
      ]);
    }
    await refreshPackageList(ctx);
  });

  bot.callbackQuery(/^admin:pkg_down:(\d+)$/, adminMiddleware, async (ctx) => {
    const pkgId = Number(ctx.match[1]);
    const pkg = await prisma.package.findUnique({ where: { id: pkgId } });
    if (!pkg) return;
    const nextPkg = await prisma.package.findFirst({
      where: { sortOrder: { gt: pkg.sortOrder } },
      orderBy: { sortOrder: 'asc' }
    });
    if (nextPkg) {
      await prisma.$transaction([
        prisma.package.update({ where: { id: pkg.id }, data: { sortOrder: nextPkg.sortOrder } }),
        prisma.package.update({ where: { id: nextPkg.id }, data: { sortOrder: pkg.sortOrder } })
      ]);
    }
    await refreshPackageList(ctx);
  });
  bot.callbackQuery(/^admin:pkg_del_confirm:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery('✅ Paket dihapus').catch(() => {});
    const pkgId = Number(ctx.match[1]);
    await prisma.package.delete({ where: { id: pkgId } }).catch(() => {});
    await refreshPackageList(ctx);
  });

  bot.callbackQuery('admin:servers', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    await refreshServerList(ctx);
  });

  bot.callbackQuery('admin:srv_add', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.set(ctx.from!.id, { action: 'srv_form', data: {} });
    await renderServerBuilder(ctx);
  });

  bot.callbackQuery(/^admin:srv_edit:(\d+)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const srvId = Number(ctx.match[1]);
    const srv = await prisma.server.findUnique({ where: { id: srvId } });
    if (!srv) return;
    adminState.set(ctx.from!.id, { action: 'srv_form', data: { ...srv } });
    await renderServerBuilder(ctx);
  });

  bot.callbackQuery(/^admin:srv_set:(name|region|flag|host|apiUrl|apiPassword|maxPeers)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const field = ctx.match[1] as ServerBuilderData['awaitingField'];
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'srv_form') return;
    
    (state.data as ServerBuilderData).awaitingField = field;
    await renderServerBuilder(ctx);
  });

  bot.callbackQuery('admin:srv_save', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'srv_form') return;
    
    const data = state.data as ServerBuilderData;
    if (!data.name || !data.region || !data.flag || !data.host || !data.apiUrl || !data.apiPassword) {
      await ctx.answerCallbackQuery({ text: '❌ Harap lengkapi semua data sebelum menyimpan!', show_alert: true }).catch(() => {});
      return;
    }

    try {
      if (data.id) {
        await prisma.server.update({
          where: { id: data.id },
          data: {
            name: data.name, region: data.region, flag: data.flag,
            host: data.host, apiUrl: data.apiUrl, apiPassword: data.apiPassword,
            maxPeers: data.maxPeers || 50
          }
        });
      } else {
        await prisma.server.create({
          data: {
            name: data.name, region: data.region, flag: data.flag,
            host: data.host, apiUrl: data.apiUrl, apiPassword: data.apiPassword,
            maxPeers: data.maxPeers || 50
          }
        });
      }
      adminState.delete(ctx.from!.id);
      await ctx.answerCallbackQuery({ text: '✅ Server berhasil disimpan!', show_alert: true }).catch(() => {});
      await refreshServerList(ctx);
    } catch (err: any) {
      await ctx.answerCallbackQuery({ text: '❌ Error: ' + err.message, show_alert: true }).catch(() => {});
    }
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

  bot.callbackQuery('admin:gate_config', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const chatName = await getDynamicConfig('gate_chat_name', '');
    const chatUrl = await getDynamicConfig('gate_chat_url', '');
    const chatId = await getDynamicConfig('gate_chat_id', '');
    adminState.set(ctx.from!.id, { action: 'gate_form', data: { chatName, chatUrl, chatId } });
    await renderGateBuilder(ctx);
  });

  bot.callbackQuery(/^admin:gate_set:(chatName|chatUrl|chatId)$/, adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const field = ctx.match[1] as GateBuilderData['awaitingField'];
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'gate_form') return;
    
    (state.data as GateBuilderData).awaitingField = field;
    await renderGateBuilder(ctx);
  });

  bot.callbackQuery('admin:gate_save', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'gate_form') return;
    
    const data = state.data as GateBuilderData;
    if (!data.chatName || !data.chatUrl || !data.chatId) {
      await ctx.answerCallbackQuery({ text: '❌ Harap lengkapi semua data sebelum menyimpan!', show_alert: true }).catch(() => {});
      return;
    }

    try {
      const { setDynamicConfig } = require('../../utils/config.util');
      await setDynamicConfig('gate_chat_name', data.chatName);
      await setDynamicConfig('gate_chat_url', data.chatUrl);
      await setDynamicConfig('gate_chat_id', data.chatId);
      
      adminState.delete(ctx.from!.id);
      await ctx.answerCallbackQuery({ text: '✅ Gate Config berhasil disimpan!', show_alert: true }).catch(() => {});
      
      const { getDynamicConfig } = require('../../utils/config.util');
      const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
      const text = ctx.t('admin_settings');
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminSettingsKeyboard(ctx.t, isGateActiveStr === 'true') }).catch(() => {});
    } catch (err: any) {
      await ctx.answerCallbackQuery({ text: '❌ Error: ' + err.message, show_alert: true }).catch(() => {});
    }
  });

  bot.callbackQuery('admin:trial_config', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const { getDynamicConfig } = require('../../utils/config.util');
    const trialDayStr = await getDynamicConfig('trial_day', '1');
    const trialDay = parseInt(trialDayStr) || 1;
    adminState.set(ctx.from!.id, { action: 'trial_form', data: { trialDay } });
    await renderTrialBuilder(ctx);
  });

  bot.callbackQuery('admin:trial_set:trialDay', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'trial_form') return;
    
    (state.data as TrialBuilderData).awaitingField = 'trialDay';
    await renderTrialBuilder(ctx);
  });

  bot.callbackQuery('admin:trial_save', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const state = adminState.get(ctx.from!.id);
    if (!state || state.action !== 'trial_form') return;
    
    const data = state.data as TrialBuilderData;
    if (!data.trialDay) {
      await ctx.answerCallbackQuery({ text: '❌ Harap isi durasi trial!', show_alert: true }).catch(() => {});
      return;
    }

    try {
      const { setDynamicConfig } = require('../../utils/config.util');
      await setDynamicConfig('trial_day', data.trialDay.toString());
      
      adminState.delete(ctx.from!.id);
      await ctx.answerCallbackQuery({ text: '✅ Trial Config berhasil disimpan!', show_alert: true }).catch(() => {});
      
      const { getDynamicConfig } = require('../../utils/config.util');
      const isGateActiveStr = await getDynamicConfig('gate_active', 'true');
      const text = ctx.t('admin_settings');
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: adminSettingsKeyboard(ctx.t, isGateActiveStr === 'true') }).catch(() => {});
    } catch (err: any) {
      await ctx.answerCallbackQuery({ text: '❌ Error: ' + err.message, show_alert: true }).catch(() => {});
    }
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

  bot.callbackQuery('admin:close', adminMiddleware, async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    adminState.delete(ctx.from!.id);
    await ctx.deleteMessage().catch(() => {});
  });

  bot.on('message', async (ctx, next) => {
    if (!ctx.from) return next();
    const state = adminState.get(ctx.from.id);
    if (!state) return next();

    if (state.action === 'gate_form' && ctx.message?.text) {
      const data = state.data as GateBuilderData;
      if (data.awaitingField) {
        data[data.awaitingField] = ctx.message.text;
        delete data.awaitingField;
        await ctx.deleteMessage().catch(() => {});
        await renderGateBuilder(ctx);
      }
      return;
    }

    if (state.action === 'trial_form' && ctx.message?.text) {
      const data = state.data as TrialBuilderData;
      if (data.awaitingField) {
        const val = parseInt(ctx.message.text);
        if (!isNaN(val)) {
          data[data.awaitingField] = val;
        }
        delete data.awaitingField;
        await ctx.deleteMessage().catch(() => {});
        await renderTrialBuilder(ctx);
      }
      return;
    }

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

    if (state.action === 'srv_form' && ctx.message?.text) {
      const data = state.data as ServerBuilderData;
      if (data.awaitingField) {
        if (data.awaitingField === 'maxPeers') {
          const val = parseInt(ctx.message.text);
          if (isNaN(val)) return next();
          data.maxPeers = val;
        } else {
          data[data.awaitingField] = ctx.message.text;
        }
        delete data.awaitingField;
        await ctx.deleteMessage().catch(() => {});
        await renderServerBuilder(ctx);
      }
      return;
    }

    if (state.action === 'pkg_form' && ctx.message?.text) {
      const data = state.data as PackageBuilderData;
      if (data.awaitingField) {
        if (data.awaitingField === 'name') {
          data.name = ctx.message.text;
        } else {
          const val = parseInt(ctx.message.text);
          if (isNaN(val)) return next();
          data[data.awaitingField] = val;
        }
        delete data.awaitingField;
        await ctx.deleteMessage().catch(() => {});
        await renderPackageBuilder(ctx);
      }
      return;
    }

    return next();
  });
};

async function refreshPackageList(ctx: MyContext) {
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: 'asc' } });
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
    kb.text('⬆️', `admin:pkg_up:${pkg.id}`)
      .text('⬇️', `admin:pkg_down:${pkg.id}`)
      .text(`${pkg.isActive ? '❌' : '✅'} ${pkg.name}`, `admin:pkg_toggle:${pkg.id}`)
      .text(`✏️ Edit`, `admin:pkg_edit:${pkg.id}`)
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
      .text(`✏️ Edit`, `admin:srv_edit:${srv.id}`)
      .text(`🗑 Hapus`, `admin:srv_del:${srv.id}`).row();
  });
  kb.text('➕ Tambah Server', 'admin:srv_add').row();
  kb.text('🔙 Kembali', 'admin:main');
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}

async function renderServerBuilder(ctx: MyContext) {
  const state = adminState.get(ctx.from!.id);
  if (!state || state.action !== 'srv_form') return;
  const data = state.data as ServerBuilderData;
  let text = '🛠 <b>Server Builder</b>\n\n';
  text += `🏷 Nama: <code>${data.name || '[Belum diisi]'}</code>\n`;
  text += `🌍 Region: <code>${data.region || '[Belum diisi]'}</code>\n`;
  text += `🏴 Bendera: <code>${data.flag || '[Belum diisi]'}</code>\n`;
  text += `🌐 Host: <code>${data.host || '[Belum diisi]'}</code>\n`;
  text += `🔗 API URL: <code>${data.apiUrl || '[Belum diisi]'}</code>\n`;
  text += `🔑 API Pass: <code>${data.apiPassword ? '***' : '[Belum diisi]'}</code>\n`;
  text += `👥 Max Peers: <code>${data.maxPeers || 50}</code>\n\n`;

  if (data.awaitingField) {
    text += `<i>Menunggu balasan Anda untuk kolom: <b>${data.awaitingField.toUpperCase()}</b>...</i>`;
  } else {
    text += `<i>Silakan edit kolom di bawah atau klik SIMPAN jika sudah selesai.</i>`;
  }

  const kb = new InlineKeyboard()
    .text('📝 Nama', 'admin:srv_set:name')
    .text('📝 Region', 'admin:srv_set:region')
    .text('📝 Bendera', 'admin:srv_set:flag').row()
    .text('📝 Host', 'admin:srv_set:host')
    .text('📝 API URL', 'admin:srv_set:apiUrl').row()
    .text('📝 API Pass', 'admin:srv_set:apiPassword')
    .text('📝 Max Peers', 'admin:srv_set:maxPeers').row()
    .text('💾 SIMPAN', 'admin:srv_save')
    .text('❌ BATAL', 'admin:cancel_action');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}

async function renderPackageBuilder(ctx: MyContext) {
  const state = adminState.get(ctx.from!.id);
  if (!state || state.action !== 'pkg_form') return;
  const data = state.data as PackageBuilderData;
  let text = '🛠 <b>Package Builder</b>\n\n';
  text += `🏷 Nama Paket: <code>${data.name || '[Belum diisi]'}</code>\n`;
  text += `📅 Durasi (hari): <code>${data.durationDay || '[Belum diisi]'}</code>\n`;
  text += `💰 Harga (Rp): <code>${data.price ? data.price.toLocaleString('id-ID') : '[Belum diisi]'}</code>\n`;
  text += `📱 Max Devices: <code>${data.maxDevices || '[Belum diisi]'}</code>\n\n`;

  if (data.awaitingField) {
    text += `<i>Menunggu balasan Anda untuk kolom: <b>${data.awaitingField.toUpperCase()}</b>...</i>`;
  } else {
    text += `<i>Silakan edit kolom di bawah atau klik SIMPAN jika sudah selesai.</i>`;
  }

  const kb = new InlineKeyboard()
    .text('📝 Nama', 'admin:pkg_set:name')
    .text('📝 Durasi', 'admin:pkg_set:durationDay').row()
    .text('📝 Harga', 'admin:pkg_set:price')
    .text('📝 Max Devices', 'admin:pkg_set:maxDevices').row()
    .text('💾 SIMPAN', 'admin:pkg_save')
    .text('❌ BATAL', 'admin:cancel_action');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}

async function renderGateBuilder(ctx: MyContext) {
  const state = adminState.get(ctx.from!.id);
  if (!state || state.action !== 'gate_form') return;
  const data = state.data as GateBuilderData;
  let text = '⛩ <b>Gate Configuration</b>\n\n';
  text += `📢 Nama Channel: <code>${data.chatName || '[Belum diisi]'}</code>\n`;
  text += `🔗 URL Channel: <code>${data.chatUrl || '[Belum diisi]'}</code>\n`;
  text += `🆔 Chat ID: <code>${data.chatId || '[Belum diisi]'}</code>\n\n`;

  if (data.awaitingField) {
    text += `<i>Menunggu balasan Anda untuk kolom: <b>${data.awaitingField.toUpperCase()}</b>...</i>\n`;
    if (data.awaitingField === 'chatId') {
      text += `\n💡 <b>Tips</b>: Anda bisa mendapatkan Chat ID dengan mengirim / mem-forward pesan dari grup/channel ke bot seperti @userinfobot atau @raw_data_bot, ID biasanya berawalan minus (contoh: <code>-100123456789</code>).`;
    }
  } else {
    text += `<i>Silakan edit kolom di bawah atau klik SIMPAN jika sudah selesai.</i>\n<i>Pastikan bot sudah dimasukkan sebagai admin ke channel/group tersebut!</i>`;
  }

  const kb = new InlineKeyboard()
    .text('📝 Edit Nama', 'admin:gate_set:chatName').row()
    .text('📝 Edit URL', 'admin:gate_set:chatUrl').row()
    .text('📝 Edit ID', 'admin:gate_set:chatId').row()
    .text('💾 SIMPAN', 'admin:gate_save')
    .text('❌ BATAL', 'admin:settings');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}

async function renderTrialBuilder(ctx: MyContext) {
  const state = adminState.get(ctx.from!.id);
  if (!state || state.action !== 'trial_form') return;
  const data = state.data as TrialBuilderData;
  let text = '⏳ <b>Trial Configuration</b>\n\n';
  text += `📅 Durasi Trial: <code>${data.trialDay || '[Belum diisi]'}</code> hari\n\n`;

  if (data.awaitingField) {
    text += `<i>Menunggu balasan Anda untuk: <b>Durasi Trial (angka)</b>...</i>`;
  } else {
    text += `<i>Silakan edit kolom di bawah atau klik SIMPAN jika sudah selesai.</i>`;
  }

  const kb = new InlineKeyboard()
    .text('📝 Edit Durasi', 'admin:trial_set:trialDay').row()
    .text('💾 SIMPAN', 'admin:trial_save')
    .text('❌ BATAL', 'admin:settings');

  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
}
