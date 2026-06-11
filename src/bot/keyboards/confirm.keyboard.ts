import { InlineKeyboard } from 'grammy';

export const confirmKeyboard = (orderId: number) => {
  return new InlineKeyboard()
    .text('✅ Bayar Sekarang', `order:pay:${orderId}`).row()
    .text('❌ Batalkan Order', `order:cancel:${orderId}`);
};
