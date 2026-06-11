import { Bot, Context } from 'grammy';
import { prisma } from '../../db/client';

export const registerReferralHandler = (bot: Bot<Context>) => {
  bot.callbackQuery('menu:referral', async (ctx) => {
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ 
      where: { telegramId: ctx.from.id },
      include: {
        referrals: true,
      }
    });
    
    if (!user) return ctx.answerCallbackQuery('User tidak ditemukan!');

    const rewards = await prisma.referralReward.findMany({
      where: { referrerId: user.id }
    });

    const totalInvited = user.referrals.length;
    const totalBought = rewards.length;
    const totalRewardDays = rewards.reduce((acc, curr) => acc + curr.rewardDay, 0);

    const link = `https://t.me/${ctx.me.username}?start=${user.referralCode}`;

    const text = `👥  <b>Referral Program</b>\n\nAjak teman, dapat bonus bareng! 🎉\n\n🔗 Link kamu:\n<code>${link}</code>\n\n📊 <b>Statistik:</b>\n┌──────────────────────────┐\n│ Total diajak  : ${totalInvited} orang\n│ Berhasil beli : ${totalBought} orang\n│ Bonus didapat : +${totalRewardDays} hari\n└──────────────────────────┘\n\nSetiap teman yang beli = bonus hari buat kamu! 🎁`;
    
    const { InlineKeyboard } = require('grammy');
    const kb = new InlineKeyboard()
      .url('Bagikan Link', `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Yuk pakai VPN super cepat bareng aku!')}`).row()
      .text('🏠 Menu Utama', 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });
};
