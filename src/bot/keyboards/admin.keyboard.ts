import { InlineKeyboard } from 'grammy';
import { TranslationKey } from '../../i18n';

export const adminKeyboard = (t: (key: TranslationKey) => string) => {
  return new InlineKeyboard()
    .text(t('btn_admin_stats'), 'admin:stats').row()
    .text(t('btn_admin_packages'), 'admin:packages').text(t('btn_admin_servers'), 'admin:servers').row()
    .text(t('btn_admin_broadcast'), 'admin:broadcast').row()
    .text(t('btn_admin_settings'), 'admin:settings').row()
    .text('❌ Tutup Panel', 'admin:close');
};

export const adminSettingsKeyboard = (t: (key: TranslationKey) => string, isGateActive: boolean) => {
  return new InlineKeyboard()
    .text(isGateActive ? t('btn_admin_gate_on') : t('btn_admin_gate_off'), 'admin:toggle_gate')
    .text('⚙️ Config Gate', 'admin:gate_config').row()
    .text('⏳ Config Trial', 'admin:trial_config').row()
    .text(t('btn_back'), 'admin:main');
};
