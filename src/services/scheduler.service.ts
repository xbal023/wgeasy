import cron from 'node-cron';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';
import { wireguardService } from './wireguard.service';
import { bot } from '../bot';
import { config } from '../config';
import { InputFile } from 'grammy';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export const startScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily database backup');
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backup-${dateStr}.sql.gz`;
    const filePath = path.join(backupDir, fileName);

    try {
      await execPromise(`pg_dump -U vpnbot -d vpnbot | gzip > ${filePath}`);
      
      for (const adminId of config.ADMIN_TELEGRAM_IDS) {
        await bot.api.sendDocument(adminId, new InputFile(filePath), {
          caption: `💾 <b>Daily Database Backup</b>\n📅 Tanggal: ${dateStr}\n\nBackup otomatis dari server Yggdrasil.`,
          parse_mode: 'HTML'
        });
      }
      
      await execPromise(`find ${backupDir} -type f -name "*.sql.gz" -mtime +7 -delete`);
    } catch (e) {
      logger.error('Failed to run backup job: ' + e);
    }
  });

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
