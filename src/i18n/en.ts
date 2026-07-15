import { id } from './id';

export const en: typeof id = {
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

  btn_admin_stats: '📊 Statistics',
  btn_admin_packages: '📦 Packages',
  btn_admin_servers: '🌍 Servers',
  btn_admin_broadcast: '📢 Broadcast',
  btn_admin_settings: '⚙️ Settings',
  btn_admin_exit: '🔙 Exit',
  btn_admin_gate_on: 'Group Gate: ✅ ON',
  btn_admin_gate_off: 'Group Gate: ❌ OFF',

  error_user_not_found: 'User not found!',
  error_data_not_found: 'Data not found!',
  error_no_access: '⛔ You do not have access to this feature.',
  processing: '⏳ Processing...',

  lang_changed: '✅ Language changed to English.',

  start_greeting: 'Hello, {name}! 👋',
  start_welcome: '━━━━━━━━━━━━━━━━━━━━━\n🌐  <b>Welcome to {botName}!</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n{greeting}\n\nEnjoy fast & secure internet with us.\n\n🔒 WireGuard Protocol\n⚡ Fast Servers\n💳 Easy QRIS Payment!\n\nPick a menu below! 👇',

  gate_message: '🔐  <b>Access Required</b>\n\nHey! To use this bot, please join our community first!\n\n<b>Group:</b> {chatName}\n\nIt\'s quick and free!',

  order_choose_server: '🌍  <b>Choose VPN Server</b>\n\nPick the closest location for the best speed! ⚡',
  order_choose_package: '📦  <b>Choose VPN Plan</b>\n\nServer: {serverFlag} {serverRegion} {serverName}',
  order_confirm: '🧾  <b>Order Summary</b>\n\n┌─────────────────────────┐\n│ Server  : {serverFlag} {serverRegion}\n│ Plan    : {pkgName}\n│ Price   : Rp {pkgPrice}\n│ Method  : QRIS\n└─────────────────────────┘\n\nPlease verify the details! ✅',
  order_cancel: '✅ Order cancelled.',
  order_qr_ready: '💳  <b>Scan the QR below!</b>\n\nOrder ID: #{refId}\nTotal: Rp {amount}\nValid for: 60 minutes\n\nAfter payment, your VPN account will be active immediately! 🚀',
  order_qr_failed: 'Sorry, failed to generate QRIS for payment. Please try again later.',

  trial_already_used: '😅  <b>Oops, you have already used a trial!</b>\n\nDon\'t worry, our premium plans are\nvery affordable! 😉',
  trial_choose_server: '🎁  <b>Free Trial!</b>\n\nChoose a server location for your trial! ⚡',
  trial_processing: '⏳ Processing your trial account...',
  trial_success: '🎉  <b>Trial Created Successfully!</b>\n\nActive until: {activeUntil}\nServer: {serverFlag} {serverName}\n\nPlease scan the QR above or use the following .conf file.',
  trial_failed: 'Failed to create trial: {error}',

  referral_stats: '👥  <b>Referral Program</b>\n\nInvite friends, get bonuses together! 🎉\n\n🔗 Your link:\n<code>{link}</code>\n\n📊 <b>Statistics:</b>\n┌──────────────────────────┐\n│ Total invited : {totalInvited} people\n│ Bought plan   : {totalBought} people\n│ Bonus days    : +{totalRewardDays} days\n└──────────────────────────┘\n\nEvery friend who buys = bonus days for you! 🎁',
  referral_share_btn: 'Share Link',
  referral_share_text: 'Use super fast VPN with me!',

  account_empty: '📋 <b>My VPN Account</b>\n\nYou don\'t have any active VPN accounts yet. Order now!',
  account_list: '📋 <b>My VPN Account</b>\n\nHere is your VPN accounts list:\n\n{accountsInfo}',
  btn_download_config: '📥 Download Config #{id}',

  help_text: '❓ <b>Help Center</b>\n\nIf you have any issues or questions about our VPN, please contact our admin below:\n\n{AdminUsername}\n\nWorking hours: 09:00 - 21:00',

  admin_stats: '📊 <b>Bot Statistics</b>\n\n👥 Total Users: {totalUsers}\n🚀 Active VPN: {activeVpn}\n\n💰 Revenue This Month: Rp {revenueMonth}\n💳 Total Revenue: Rp {revenueTotal}',
  admin_settings: '⚙️ <b>Settings Panel</b>\n\nConfigure bot dynamically:',
  admin_broadcast_prompt: 'Send the message you want to broadcast to ALL users (supports Images/Videos/Files):\n\nType /cancel to abort.',
  admin_broadcast_cancel: 'Broadcast cancelled.',
  admin_broadcast_executing: 'Executing broadcast to {userCount} users in the background... You will be notified once it\'s done.',
};
