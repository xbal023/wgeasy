import { config } from "../../config";

export const buildStartMessage = (name: string) => {
  return `━━━━━━━━━━━━━━━━━━━━━
🌐  <b>Selamat datang di ${config.BOT_NAME}!</b>
     <i>Welcome to ${config.BOT_NAME}!</i>
━━━━━━━━━━━━━━━━━━━━━

Halo, ${name}! 👋
<i>Hey there, ${name}!</i> 👋

Nikmati internet bebas & aman bersama kami.
<i>Enjoy fast & secure internet with us.</i>

🔒 WireGuard Protocol
⚡ Multi-region server
💳 Bayar QRIS, mudah dan cepat!

Pilih menu di bawah ya! 👇
<i>Pick a menu below!</i> 👇`;
};

export const buildGateMessage = (chatName: string) => {
  return `🔐  <b>Akses Terbatas</b>
     <i>Access Required</i>

Hei! Sebelum menggunakan bot ini, silahkan bergabung kedalam komunitas!
<i>Hey! To use this bot, please join our
community first!</i>

📢  <b>${chatName}</b>

Ini cepat dan gratis!
<i>It's quick and free!</i>`;
};
