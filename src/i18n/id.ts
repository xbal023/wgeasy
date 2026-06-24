export const id = {
  // Buttons
  btn_buy: '🛒 BUY',
  btn_account: '📋 Akun Saya',
  btn_trial: '🎁 TRIAL',
  btn_referral: '👥 Referral',
  btn_help: '❓ HELP',
  btn_verify: '✅ VERIFY',
  btn_join_community: '👉 JOIN COMMUNITY',
  btn_back: '🔙 BACK',
  btn_back_main: '🏠 Menu Utama',
  btn_pay: '✅ PAY',
  btn_cancel: '❌ CANCEL',
  btn_buy_now: '🛒 Beli Sekarang',
  
  // Admin Buttons
  btn_admin_stats: '📊 Statistik',
  btn_admin_packages: '📦 Paket',
  btn_admin_servers: '🌍 Server',
  btn_admin_broadcast: '📢 Broadcast',
  btn_admin_settings: '⚙️ Settings',
  btn_admin_exit: '🔙 Keluar',
  btn_admin_gate_on: 'Group Gate: ✅ ON',
  btn_admin_gate_off: 'Group Gate: ❌ OFF',

  // Common
  error_user_not_found: 'User tidak ditemukan!',
  error_data_not_found: 'Data tidak ditemukan!',
  error_no_access: '⛔ Anda tidak memiliki akses ke fitur ini.',
  processing: '⏳ Memproses...',

  // Language
  lang_changed: '✅ Bahasa telah diubah ke Bahasa Indonesia.',

  // Start Message
  start_greeting: 'Halo, {name}! 👋',
  start_welcome: '━━━━━━━━━━━━━━━━━━━━━\n🌐  <b>Selamat datang di {botName}!</b>\n     <i>Welcome to {botName}!</i>\n━━━━━━━━━━━━━━━━━━━━━\n\n{greeting}\n\nNikmati internet bebas & aman bersama kami.\n<i>Enjoy fast & secure internet with us.</i>\n\n🔒 WireGuard Protocol\n⚡ Server Anti Lelet\n💳 Bayar QRIS, mudah dan cepat!\n\nPilih menu di bawah ya! 👇\n<i>Pick a menu below!</i> 👇',

  // Gate Message
  gate_message: '🔐  <b>Akses Terbatas</b>\n     <i>Access Required</i>\n\nHei! Sebelum menggunakan bot ini, silahkan bergabung kedalam komunitas!\n<i>Hey! To use this bot, please join our\ncommunity first!</i>\n\n<b>Group:</b> {chatName}\n\nIni cepat dan gratis!\n<i>It\'s quick and free!</i>',

  // Order
  order_choose_server: '🌍  <b>Pilih Server VPN</b>\n     <i>Choose your server</i>\n\nPilih lokasi yang paling dekat sama kamu\nuntuk koneksi tercepat! ⚡\n<i>Pick the closest location for best speed!</i>',
  order_choose_package: '📦  <b>Pilih Paket VPN</b>\n     <i>Choose your plan</i>\n\nServer: {serverFlag} {serverRegion} {serverName}',
  order_confirm: '🧾  <b>Konfirmasi Order</b>\n     <i>Order Summary</i>\n\n┌─────────────────────────┐\n│ Server  : {serverFlag} {serverRegion}\n│ Paket   : {pkgName}\n│ Harga   : Rp {pkgPrice}\n│ Metode  : QRIS\n└─────────────────────────┘\n\nPastiin detailnya udah bener ya! ✅',
  order_cancel: '✅ Order dibatalkan.',
  order_qr_ready: '💳  <b>Scan QR di bawah ini ya!</b>\n\nOrder ID: #{refId}\nTotal: Rp {amount}\nBerlaku: 60 menit\n\nSetelah bayar, akun VPN langsung aktif otomatis! 🚀',
  order_qr_failed: 'Maaf, gagal membuat QRIS pembayaran. Silakan coba lagi nanti.',

  // Trial
  trial_already_used: '😅  <b>Ups, kamu udah pernah trial nih!</b>\n\nTapi tenang, paket berbayar kita\nterjangkau banget lho! 😉',
  trial_choose_server: '🎁  <b>Trial Gratis!</b>\n\nPilih lokasi server untuk trial kamu! ⚡',
  trial_processing: '⏳ Memproses akun trial Anda...',
  trial_success: '🎉  <b>Trial Berhasil Dibuat!</b>\n\nAktif s/d: {activeUntil}\nServer: {serverFlag} {serverName}\n\nSilakan scan QR di atas atau gunakan file .conf berikut.',
  trial_failed: 'Gagal membuat trial: {error}',

  // Referral
  referral_stats: '👥  <b>Referral Program</b>\n\nAjak teman, dapat bonus bareng! 🎉\n\n🔗 Link kamu:\n<code>{link}</code>\n\n📊 <b>Statistik:</b>\n┌──────────────────────────┐\n│ Total diajak  : {totalInvited} orang\n│ Berhasil beli : {totalBought} orang\n│ Bonus didapat : +{totalRewardDays} hari\n└──────────────────────────┘\n\nSetiap teman yang beli = bonus hari buat kamu! 🎁',
  referral_share_btn: 'Bagikan Link',
  referral_share_text: 'Yuk pakai VPN super cepat bareng aku!',

  // Admin
  admin_stats: '📊 <b>Statistik Bot</b>\n\n👥 Total Users: {totalUsers}\n🚀 VPN Aktif: {activeVpn}\n\n💰 Pendapatan Bulan Ini: Rp {revenueMonth}\n💳 Total Pendapatan: Rp {revenueTotal}',
  admin_settings: '⚙️ <b>Settings Panel</b>\n\nAtur konfigurasi bot secara dinamis:',
  admin_broadcast_prompt: 'Kirimkan pesan yang ingin di-broadcast ke SEMUA user (mendukung Gambar/Video/File):\n\nKetik /cancel untuk membatalkan.',
  admin_broadcast_cancel: 'Broadcast dibatalkan.',
  admin_broadcast_executing: 'Mengeksekusi broadcast ke {userCount} users di latar belakang... Anda akan menerima notifikasi jika sudah selesai.',
};
