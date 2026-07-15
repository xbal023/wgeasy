import { InlineKeyboard } from 'grammy';
import { TranslationKey } from '../../i18n';

export const mainKeyboard = (t: (key: TranslationKey) => string) => {
  return new InlineKeyboard()
    .text(t('btn_buy'), 'menu:buy').text(t('btn_account'), 'menu:account').row()
    .text(t('btn_trial'), 'menu:trial').text(t('btn_referral'), 'menu:referral').row()
    .text(t('btn_help'), 'menu:help');
};

export const buildGateKeyboard = (t: (key: TranslationKey) => string, chatUrl: string, callbackId?: string) => {
  const kb = new InlineKeyboard().url(t('btn_join_community'), chatUrl).row();
  if (callbackId) {
    kb.text(t('btn_verify'), 'gate:recheck');
  } else {
    kb.text(t('btn_verify'), 'gate:recheck');
  }
  return kb;
};
