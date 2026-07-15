import cron from 'node-cron';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { wireguardService } from './wireguard.service';

export const startScheduler = () => {
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running expiry notification job (Mock)');
  });

  cron.schedule('0 * * * *', async () => {
    logger.info('Running auto-suspend job');
    const now = new Date();
    try {
      const expiredAccounts = await prisma.vpnAccount.findMany({
        where: {
          isSuspended: false,
          activeUntil: { lte: now }
        },
        include: { server: true, user: true }
      });

      for (const acc of expiredAccounts) {
        try {
          await wireguardService.disablePeer(acc.server, acc.publicKey || acc.peerName);
          await prisma.vpnAccount.update({
            where: { id: acc.id },
            data: { isSuspended: true }
          });
          logger.info(`Suspended account ${acc.peerName} for user ${acc.user.telegramId}`);
        } catch (err) {
          logger.error(`Failed to suspend account ${acc.id}: ${err}`);
        }
      }
    } catch (e) {
      logger.error('Failed to run auto-suspend job: ' + e);
    }
  });

  logger.info('Scheduler started');
};
