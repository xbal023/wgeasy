import { InlineKeyboard } from 'grammy';
import { TranslationKey } from '../../i18n';

export const adminKeyboard = (t: (key: TranslationKey) => string) => {
  return new InlineKeyboard()
    .text(t('btn_admin_stats'), 'admin:stats').row()
    .text(t('btn_admin_packages'), 'admin:packages').text(t('btn_admin_servers'), 'admin:servers').row()
    .text(t('btn_admin_broadcast'), 'admin:broadcast').row()
    .text(t('btn_admin_settings'), 'admin:settings').row()
    .text(t('btn_admin_exit'), 'menu:main');
};

export const adminSettingsKeyboard = (t: (key: TranslationKey) => string, isGateActive: boolean) => {
  return new InlineKeyboard()
    .text(isGateActive ? t('btn_admin_gate_on') : t('btn_admin_gate_off'), 'admin:toggle_gate').row()
    .text(t('btn_back'), 'admin:main');
};
