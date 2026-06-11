import { InlineKeyboard } from 'grammy';
import { Package } from '@prisma/client';

export const packageKeyboard = (packages: Package[], serverId: number) => {
  const kb = new InlineKeyboard();
  packages.forEach((pkg) => {
    kb.text(`${pkg.name} — Rp ${pkg.price.toLocaleString('id-ID')}`, `order:package:${pkg.id}:${serverId}`).row();
  });
  kb.text('← Kembali / Back', 'menu:buy');
  return kb;
};
