import { InlineKeyboard } from 'grammy';
import { Server } from '@prisma/client';
import { TranslationKey } from '../../i18n';

export const serverKeyboard = (t: (key: TranslationKey) => string, servers: Server[]) => {
  const kb = new InlineKeyboard();
  servers.forEach((server) => {
    kb.text(`${server.flag} ${server.region} ${server.name}`, `order:server:${server.id}`).row();
  });
  kb.text(t('btn_back'), 'menu:main');
  return kb;
};
