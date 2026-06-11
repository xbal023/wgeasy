export const buildStartMessage = (name: string) => {
  return `━━━━━━━━━━━━━━━━━━━━━
🌐  <b>Selamat datang di VPN Bot!</b>
     <i>Welcome to VPN Bot!</i>
━━━━━━━━━━━━━━━━━━━━━

Halo, ${name}! 👋
<i>Hey there, ${name}!</i> 👋

Nikmati internet bebas & aman bareng kami.
<i>Enjoy fast & secure internet with us.</i>

🔒 WireGuard Protocol
⚡ Multi-region server
💳 Bayar QRIS, gampang banget!

Pilih menu di bawah ya! 👇
<i>Pick a menu below!</i> 👇`;
};

export const buildGateMessage = (chatName: string) => {
  return `🔐  <b>Akses Terbatas</b>
     <i>Access Required</i>

Hei! Sebelum pakai bot ini, kamu perlu
join komunitas kita dulu ya! 😊
<i>Hey! To use this bot, please join our
community first!</i>

📢  <b>${chatName}</b>

Beneran cuma sebentar kok, gratis!
<i>It's quick and free, we promise!</i>`;
};
