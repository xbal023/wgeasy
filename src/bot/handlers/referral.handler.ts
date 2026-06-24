import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from '../index';
import { prisma } from '../../db/client';

export const registerReferralHandler = (bot: Bot<MyContext>) => {
  bot.callbackQuery('menu:referral', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ 
      where: { telegramId: ctx.from.id },
      include: {
        referrals: true,
      }
    });
    
    if (!user) return ctx.answerCallbackQuery(ctx.t('error_user_not_found'));

    const rewards = await prisma.referralReward.findMany({
      where: { referrerId: user.id }
    });

    const totalInvited = user.referrals.length;
    const totalBought = rewards.length;
    const totalRewardDays = rewards.reduce((acc, curr) => acc + curr.rewardDay, 0);

    const link = `https://t.me/${ctx.me.username}?start=${user.referralCode}`;

    const text = ctx.t('referral_stats', { link, totalInvited, totalBought, totalRewardDays });
    
    const kb = new InlineKeyboard()
      .url(ctx.t('referral_share_btn'), `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(ctx.t('referral_share_text'))}`).row()
      .text(ctx.t('btn_back_main'), 'menu:main');

    await ctx.editMessageCaption({ caption: text, parse_mode: 'HTML', reply_markup: kb }).catch(async () => {
        await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() => {});
    });
  });
};
