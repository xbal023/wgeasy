import { InlineKeyboard } from 'grammy';

export const confirmKeyboard = (orderId: number) => {
  return new InlineKeyboard()
    .text('✅ Bayar', `order:pay:${orderId}`).row()
    .text('❌ Batal', `order:cancel:${orderId}`);
};
