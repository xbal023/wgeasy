import { InlineKeyboard } from 'grammy';

export const confirmKeyboard = (orderId: number) => {
  return new InlineKeyboard()
    .text('✅ PAY', `order:pay:${orderId}`).row()
    .text('❌ CANCEL', `order:cancel:${orderId}`);
};
