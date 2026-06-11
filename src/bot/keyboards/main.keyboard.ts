import { InlineKeyboard } from 'grammy';

export const mainKeyboard = () => {
  return new InlineKeyboard()
    .text('🛒 Beli VPN', 'menu:buy').text('📋 Akun Saya', 'menu:account').row()
    .text('🎁 Trial', 'menu:trial').text('👥 Referral', 'menu:referral').row()
    .text('❓ Bantuan / Help', 'menu:help');
};

export const buildGateKeyboard = (chatUrl: string, callbackId?: string) => {
  const kb = new InlineKeyboard().url('👉 Join Komunitas Sekarang', chatUrl).row();
  if (callbackId) {
    kb.text('✅ Sudah Join — Cek Ulang', 'gate:recheck');
  } else {
    kb.text('✅ Sudah Join — Cek Ulang', 'gate:recheck');
  }
  return kb;
};
