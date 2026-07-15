import { InlineKeyboard } from 'grammy';
import { Package } from '@prisma/client';
import { TranslationKey } from '../../i18n';

export const packageKeyboard = (t: (key: TranslationKey) => string, packages: Package[], serverId: number) => {
  const kb = new InlineKeyboard();
  packages.forEach((pkg) => {
    kb.text(`${pkg.name} — Rp ${pkg.price.toLocaleString('id-ID')}`, `order:package:${pkg.id}:${serverId}`).row();
  });
  kb.text(t('btn_back'), 'menu:buy');
  return kb;
};
