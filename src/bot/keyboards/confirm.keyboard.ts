import { InlineKeyboard } from 'grammy';
import { TranslationKey } from '../../i18n';

export const confirmKeyboard = (t: (key: TranslationKey) => string, orderId: number) => {
  return new InlineKeyboard()
    .text(t('btn_pay'), `order:pay:${orderId}`).row()
    .text(t('btn_cancel'), `order:cancel:${orderId}`);
};
