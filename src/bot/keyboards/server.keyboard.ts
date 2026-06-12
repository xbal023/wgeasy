import { InlineKeyboard } from 'grammy';
import { Server } from '@prisma/client';

export const serverKeyboard = (servers: Server[]) => {
  const kb = new InlineKeyboard();
  servers.forEach((server) => {
    kb.text(`${server.flag} ${server.region} ${server.name}`, `order:server:${server.id}`).row();
  });
  kb.text('🔙 BACK', 'menu:main');
  return kb;
};
