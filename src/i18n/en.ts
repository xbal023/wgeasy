import { id } from './id';

export const en: typeof id = {
  // Buttons
  btn_buy: '🛒 BUY',
  btn_account: '📋 My Account',
  btn_trial: '🎁 TRIAL',
  btn_referral: '👥 Referral',
  btn_help: '❓ HELP',
  btn_verify: '✅ VERIFY',
  btn_join_community: '👉 JOIN COMMUNITY',
  btn_back: '🔙 BACK',
  btn_back_main: '🏠 Main Menu',
  btn_pay: '✅ PAY',
  btn_cancel: '❌ CANCEL',
  btn_buy_now: '🛒 Buy Now',

  // Admin Buttons
  btn_admin_stats: '📊 Statistics',
  btn_admin_packages: '📦 Packages',
  btn_admin_servers: '🌍 Servers',
  btn_admin_broadcast: '📢 Broadcast',
  btn_admin_settings: '⚙️ Settings',
  btn_admin_exit: '🔙 Exit',
  btn_admin_gate_on: 'Group Gate: ✅ ON',
  btn_admin_gate_off: 'Group Gate: ❌ OFF',

  // Common
  error_user_not_found: 'User not found!',
  error_data_not_found: 'Data not found!',
  error_no_access: '⛔ You do not have access to this feature.',
  processing: '⏳ Processing...',

  // Language
  lang_changed: '✅ Language changed to English.',

  // Start Message
  start_greeting: 'Hello, {name}! 👋',
  start_welcome: '━━━━━━━━━━━━━━━━━━━━━\n🌐  <b>Selamat datang di {botName}!</b>\n     <i>Welcome to {botName}!</i>\n━━━━━━━━━━━━━━━━━━━━━\n\n{greeting}\n\nNikmati internet bebas & aman bersama kami.\n<i>Enjoy fast & secure internet with us.</i>\n\n🔒 WireGuard Protocol\n⚡ Server Anti Lelet\n💳 Bayar QRIS, mudah dan cepat!\n\nPilih menu di bawah ya! 👇\n<i>Pick a menu below!</i> 👇',

  // Gate Message
  gate_message: '🔐  <b>Akses Terbatas</b>\n     <i>Access Required</i>\n\nHei! Sebelum menggunakan bot ini, silahkan bergabung kedalam komunitas!\n<i>Hey! To use this bot, please join our\ncommunity first!</i>\n\n<b>Group:</b> {chatName}\n\nIni cepat dan gratis!\n<i>It\'s quick and free!</i>',

  // Order
  order_choose_server: '🌍  <b>Choose VPN Server</b>\n\nPick the closest location for the best speed! ⚡',
  order_choose_package: '📦  <b>Choose VPN Plan</b>\n\nServer: {serverFlag} {serverRegion} {serverName}',
  order_confirm: '🧾  <b>Order Summary</b>\n\n┌─────────────────────────┐\n│ Server  : {serverFlag} {serverRegion}\n│ Plan    : {pkgName}\n│ Price   : Rp {pkgPrice}\n│ Method  : QRIS\n└─────────────────────────┘\n\nPlease verify the details! ✅',
  order_cancel: '✅ Order cancelled.',
  order_qr_ready: '💳  <b>Scan the QR below!</b>\n\nOrder ID: #{refId}\nTotal: Rp {amount}\nValid for: 60 minutes\n\nAfter payment, your VPN account will be active immediately! 🚀',
  order_qr_failed: 'Sorry, failed to generate QRIS for payment. Please try again later.',

  // Trial
  trial_already_used: '😅  <b>Oops, you have already used a trial!</b>\n\nDon\'t worry, our premium plans are\nvery affordable! 😉',
  trial_choose_server: '🎁  <b>Free Trial!</b>\n\nChoose a server location for your trial! ⚡',
  trial_processing: '⏳ Processing your trial account...',
  trial_success: '🎉  <b>Trial Created Successfully!</b>\n\nActive until: {activeUntil}\nServer: {serverFlag} {serverName}\n\nPlease scan the QR above or use the following .conf file.',
  trial_failed: 'Failed to create trial: {error}',

  // Referral
  referral_stats: '👥  <b>Referral Program</b>\n\nInvite friends, get bonuses together! 🎉\n\n🔗 Your link:\n<code>{link}</code>\n\n📊 <b>Statistics:</b>\n┌──────────────────────────┐\n│ Total invited : {totalInvited} people\n│ Bought plan   : {totalBought} people\n│ Bonus days    : +{totalRewardDays} days\n└──────────────────────────┘\n\nEvery friend who buys = bonus days for you! 🎁',
  referral_share_btn: 'Share Link',
  referral_share_text: 'Use super fast VPN with me!',

  // Admin
  admin_stats: '📊 <b>Bot Statistics</b>\n\n👥 Total Users: {totalUsers}\n🚀 Active VPN: {activeVpn}\n\n💰 Revenue This Month: Rp {revenueMonth}\n💳 Total Revenue: Rp {revenueTotal}',
  admin_settings: '⚙️ <b>Settings Panel</b>\n\nConfigure bot dynamically:',
  admin_broadcast_prompt: 'Send the message you want to broadcast to ALL users (supports Images/Videos/Files):\n\nType /cancel to abort.',
  admin_broadcast_cancel: 'Broadcast cancelled.',
  admin_broadcast_executing: 'Executing broadcast to {userCount} users in the background... You will be notified once it\'s done.',
};
