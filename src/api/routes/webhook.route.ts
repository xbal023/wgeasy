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
              where: { userId: order.user.referredById, isSuspended: false },
              orderBy: { activeUntil: 'desc' }
            });

            if (referrerVpn) {
               const newActiveUntil = new Date(referrerVpn.activeUntil);
               newActiveUntil.setDate(newActiveUntil.getDate() + rewardDay);
               await prisma.vpnAccount.update({
                  where: { id: referrerVpn.id },
                  data: { activeUntil: newActiveUntil }
               });
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
