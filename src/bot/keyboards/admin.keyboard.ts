import { InlineKeyboard } from 'grammy';

export const adminKeyboard = () => {
  return new InlineKeyboard()
    .text('📊 Statistik', 'admin:stats').row()
    .text('📢 Broadcast', 'admin:broadcast').row()
    .text('⚙️ Settings', 'admin:settings').row()
    .text('🔙 Keluar', 'menu:main');
};

export const adminSettingsKeyboard = (isGateActive: boolean) => {
  return new InlineKeyboard()
    .text(`Group Gate: ${isGateActive ? '✅ ON' : '❌ OFF'}`, 'admin:toggle_gate').row()
    .text('🔙 Kembali', 'admin:main');
};
