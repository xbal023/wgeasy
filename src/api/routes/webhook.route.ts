import { Router } from 'express';
import { verifySignature } from '../middlewares/verify-signature';
import { prisma } from '../../db/client';
import { logger } from '../../utils/logger';

const router = Router();

router.post('/payment', verifySignature, async (req, res) => {
  try {
    const { orderId, status, paidAt } = req.body;
    logger.info(`Webhook received for order ${orderId} with status ${status}`);
    
    if (status === 'PAID') {
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { user: true, package: true }
      });

      if (order && order.status === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            paidAt: paidAt ? new Date(paidAt) : new Date(),
          }
        });

        logger.info(`Order ${orderId} marked as PAID`);

        // === PROVISION VPN ===
        const server = await prisma.server.findUnique({ where: { id: order.serverId as number } });
        if (server) {
          try {
            const { wireguardService } = require('../../services/wireguard.service');
            const { generateQrCode } = require('../../services/qrcode.service');
            const { bot } = require('../../bot');
            const { InputFile } = require('grammy');
            
            const peerName = `user-${order.user.id}-${Date.now()}`;
            const wgConfig = await wireguardService.createPeer(server, peerName);
            
            let rewardDayForBuyer = 0;
            const { getDynamicConfig } = require('../../utils/config.util');

            // Handle Referral Bonus for Buyer (Referee)
            if (order.user.referredById) {
              const rewardDayStr = await getDynamicConfig('referral_reward_day', '7');
              rewardDayForBuyer = parseInt(rewardDayStr) || 7;
            }

            const activeUntil = new Date();
            activeUntil.setDate(activeUntil.getDate() + order.package.durationDay + rewardDayForBuyer);

            await prisma.vpnAccount.create({
              data: {
                userId: order.user.id,
                orderId: order.id,
                serverId: server.id,
                peerName,
                privateKey: 'ENCRYPTED',
                publicKey: wgConfig.publicKey,
                assignedIp: wgConfig.assignedIp,
                configFile: wgConfig.configFile,
                isTrial: false,
                activeUntil
              }
            });

            // Send config to Telegram
            const qrBuffer = await generateQrCode(wgConfig.configFile);
            const text = `🎉 <b>Pembayaran Berhasil!</b>\n\nAkun VPN Anda telah aktif sampai dengan ${activeUntil.toLocaleDateString()}.\n\nServer: ${server.flag} ${server.name}\nIP: <code>${wgConfig.assignedIp}</code>\n\nTerima kasih telah berlangganan!`;

            await bot.api.sendPhoto(order.user.telegramId.toString(), new InputFile(qrBuffer, 'qr.png'), { caption: text, parse_mode: 'HTML' });
            await bot.api.sendDocument(order.user.telegramId.toString(), new InputFile(Buffer.from(wgConfig.configFile), `${peerName}.conf`));

          } catch (err) {
            logger.error(`Failed to provision VPN for order ${order.id}: ${err}`);
          }
        }
        
        // === REFERRAL REWARD FOR REFERRER ===
        if (order.user.referredById) {
          const { getDynamicConfig } = require('../../utils/config.util');
          const rewardDayStr = await getDynamicConfig('referral_reward_day', '7');
          const rewardDay = parseInt(rewardDayStr) || 7;

          const existingReward = await prisma.referralReward.findFirst({
            where: { orderId: order.id }
          });

          if (!existingReward) {
            await prisma.referralReward.create({
              data: {
                referrerId: order.user.referredById,
                refereeId: order.userId,
                orderId: order.id,
                rewardDay: rewardDay,
                isApplied: true
              }
            });

            const referrerVpn = await prisma.vpnAccount.findFirst({
              where: { userId: order.user.referredById },
              orderBy: { createdAt: 'desc' }
            });

            if (referrerVpn) {
               const baseDate = (referrerVpn.isSuspended || referrerVpn.activeUntil < new Date()) ? new Date() : new Date(referrerVpn.activeUntil);
               baseDate.setDate(baseDate.getDate() + rewardDay);
               
               if (referrerVpn.isSuspended) {
                  const srv = await prisma.server.findUnique({ where: { id: referrerVpn.serverId } });
                  if (srv) {
                    try {
                      const { wireguardService } = require('../../services/wireguard.service');
                      // Find actual client ID from name since wg-easy API needs ID
                      const axios = require('axios');
                      const cookiesRes = await axios.post(`${srv.apiUrl}/api/session`, { password: srv.apiPassword });
                      const cookies = cookiesRes.headers['set-cookie'] || [];
                      const peersRes = await axios.get(`${srv.apiUrl}/api/wireguard/client`, { headers: { Cookie: cookies } });
                      const peer = peersRes.data.find((p: any) => p.name === referrerVpn.peerName);
                      if (peer) {
                        await wireguardService.enablePeer(srv, peer.id);
                      }
                    } catch (e) {
                      logger.error(`Failed to re-enable peer for referral reward: ${e}`);
                    }
                  }
               }
               
               await prisma.vpnAccount.update({
                  where: { id: referrerVpn.id },
                  data: { activeUntil: baseDate, isSuspended: false }
               });
               
               const referrerUser = await prisma.user.findUnique({ where: { id: order.user.referredById }});
               if (referrerUser) {
                 const { bot } = require('../../bot');
                 await bot.api.sendMessage(referrerUser.telegramId.toString(), `🎁 <b>Bonus Referral!</b>\n\nTeman Anda baru saja berlangganan. Waktu aktif VPN Anda telah ditambahkan +${rewardDay} hari!`, { parse_mode: 'HTML' }).catch(() => {});
               }
            }
          }
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error('Webhook processing error: ' + err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
