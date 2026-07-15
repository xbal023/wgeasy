#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

INSTALL_DIR="/opt/wgeasy"
REPO_URL="https://github.com/xbal023/wgeasy.git"

banner() {
  clear
  echo -e "${CYAN}"
  echo "⚡ WGEasy VPN Bot - Auto Installer"
  echo -e "${NC}"
}

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()  { echo -e "${BLUE}[i]${NC} $1"; }
step()  { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }

# Check root
check_root() {
  if [ "$EUID" -ne 0 ]; then
    error "Script harus dijalankan sebagai root! Gunakan: sudo bash install.sh"
  fi
}

# Collect user input
collect_input() {
  step "📋 Konfigurasi"

  # Detect public IP
  PUBLIC_IP=$(curl -4 -s ifconfig.me 2>/dev/null || curl -4 -s icanhazip.com 2>/dev/null || echo "")

  read -rp "$(echo -e "${CYAN}Bot Token Telegram: ${NC}")" BOT_TOKEN
  [ -z "$BOT_TOKEN" ] && error "Bot Token tidak boleh kosong!"

  read -rp "$(echo -e "${CYAN}Admin Telegram IDs (pisah koma): ${NC}")" ADMIN_IDS
  [ -z "$ADMIN_IDS" ] && error "Admin ID tidak boleh kosong!"

  read -rp "$(echo -e "${CYAN}Domain VPN (contoh: vpn.domain.com): ${NC}")" VPN_DOMAIN
  [ -z "$VPN_DOMAIN" ] && error "Domain VPN tidak boleh kosong!"

  read -rp "$(echo -e "${CYAN}Domain Bot/Webhook (contoh: bot.domain.com): ${NC}")" BOT_DOMAIN
  [ -z "$BOT_DOMAIN" ] && error "Domain Bot tidak boleh kosong!"

  read -rp "$(echo -e "${CYAN}Password WG-Easy Admin [bl@ckM30NK]: ${NC}")" WG_PASSWORD
  WG_PASSWORD=${WG_PASSWORD:-"bl@ckM30NK"}

  read -rp "$(echo -e "${CYAN}Password PostgreSQL [vpnbot]: ${NC}")" DB_PASSWORD
  DB_PASSWORD=${DB_PASSWORD:-"vpnbot"}

  read -rp "$(echo -e "${CYAN}DB Username [vpnbot]: ${NC}")" DB_USER
  DB_USER=${DB_USER:-"vpnbot"}

  read -rp "$(echo -e "${CYAN}DB Name [vpnbot]: ${NC}")" DB_NAME
  DB_NAME=${DB_NAME:-"vpnbot"}

  # Generate random encryption key
  ENCRYPTION_KEY=$(openssl rand -hex 16)

  echo ""
  info "Public IP terdeteksi: ${PUBLIC_IP:-tidak ditemukan}"
  echo ""
  echo -e "${YELLOW}╔═════════════════════════════════${NC}"
  echo -e "${YELLOW}║${NC}  Bot Token    : ${BOT_TOKEN:0:20}..."
  echo -e "${YELLOW}║${NC}  Admin IDs    : ${ADMIN_IDS}"
  echo -e "${YELLOW}║${NC}  VPN Domain   : ${VPN_DOMAIN}"
  echo -e "${YELLOW}║${NC}  Bot Domain   : ${BOT_DOMAIN}"
  echo -e "${YELLOW}║${NC}  WG Password  : ${WG_PASSWORD}"
  echo -e "${YELLOW}║${NC}  DB User/Pass : ${DB_USER}/${DB_PASSWORD}"
  echo -e "${YELLOW}╚═════════════════════════════════${NC}"
  echo ""

  read -rp "$(echo -e "${CYAN}Lanjutkan instalasi? (y/n): ${NC}")" CONFIRM
  [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ] && error "Instalasi dibatalkan."
}

# Install Docker
install_docker() {
  step "🐳 Instalasi Docker"

  if command -v docker &>/dev/null; then
    log "Docker sudah terinstall: $(docker --version)"
  else
    info "Menginstall Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker berhasil diinstall"
  fi

  # Docker Compose plugin check
  if docker compose version &>/dev/null; then
    log "Docker Compose sudah tersedia"
  else
    info "Menginstall Docker Compose plugin..."
    apt-get install -y docker-compose-plugin 2>/dev/null || true
    log "Docker Compose berhasil diinstall"
  fi
}

# Install Node.js
install_nodejs() {
  step "📦 Instalasi Node.js"

  if command -v node &>/dev/null; then
    NODE_VER=$(node -v)
    log "Node.js sudah terinstall: ${NODE_VER}"
  else
    info "Menginstall Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    log "Node.js berhasil diinstall: $(node -v)"
  fi

  # Install PM2
  if command -v pm2 &>/dev/null; then
    log "PM2 sudah terinstall"
  else
    info "Menginstall PM2..."
    npm install -g pm2
    log "PM2 berhasil diinstall"
  fi

  # Install tsx globally
  if command -v tsx &>/dev/null; then
    log "tsx sudah terinstall"
  else
    info "Menginstall tsx..."
    npm install -g tsx
    log "tsx berhasil diinstall"
  fi
}

# Setup PostgreSQL via Docker
setup_database() {
  step "🗄️  Setup PostgreSQL"

  # Check if postgres container is already running
  if docker ps --format '{{.Names}}' | grep -q 'wgeasy-db'; then
    log "PostgreSQL container sudah berjalan"
  else
    info "Menjalankan PostgreSQL container..."

    # Create docker-compose for DB
    cat > "${INSTALL_DIR}/docker-compose.yml" <<DBEOF
services:
  db:
    image: postgres:16-alpine
    container_name: wgeasy-db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
DBEOF

    cd "${INSTALL_DIR}"
    docker compose up -d
    log "PostgreSQL berjalan di port 5432"

    # Wait for DB to be ready
    info "Menunggu database siap..."
    sleep 5
    for i in {1..15}; do
      if docker exec wgeasy-db pg_isready -U "${DB_USER}" &>/dev/null; then
        log "Database siap!"
        break
      fi
      sleep 2
    done
  fi
}

# Setup WG-Easy via Docker
setup_wgeasy() {
  step "🔐 Setup WG-Easy (WireGuard)"

  if docker ps --format '{{.Names}}' | grep -q 'wg-easy'; then
    warn "WG-Easy container sudah berjalan, recreating..."
    docker stop wg-easy && docker rm wg-easy
  fi

  info "Menjalankan WG-Easy container..."
  docker run -d \
    --name wg-easy \
    -e "WG_HOST=${VPN_DOMAIN}" \
    -e "PASSWORD=${WG_PASSWORD}" \
    -e PORT=51821 \
    -e WG_PORT=51820 \
    -e WG_DEFAULT_ADDRESS=10.8.0.x \
    -e WG_DEFAULT_DNS=1.1.1.1 \
    -e WG_MTU=1420 \
    -e "WG_ALLOWED_IPS=0.0.0.0/0, ::/0" \
    -e UI_TRAFFIC_STATS=true \
    -e UI_CHART_TYPE=0 \
    -v /opt/wg-easy/config:/etc/wireguard \
    -p 51820:51820/udp \
    -p 51821:51821/tcp \
    --cap-add NET_ADMIN \
    --cap-add SYS_MODULE \
    --sysctl net.ipv4.ip_forward=1 \
    --sysctl net.ipv4.conf.all.src_valid_mark=1 \
    --restart unless-stopped \
    weejewel/wg-easy

  sleep 3

  if docker ps --format '{{.Names}}' | grep -q 'wg-easy'; then
    log "WG-Easy berjalan! Dashboard: http://localhost:51821"
  else
    error "WG-Easy gagal dijalankan. Cek: docker logs wg-easy"
  fi
}

# Clone & Setup Bot
setup_bot() {
  step "🤖 Setup Telegram Bot"

  if [ -d "${INSTALL_DIR}/.git" ]; then
    info "Repository sudah ada, pulling latest..."
    cd "${INSTALL_DIR}"
    git stash 2>/dev/null || true
    git pull origin master
  else
    info "Cloning repository..."
    git clone "${REPO_URL}" "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
  fi

  # Create .env
  info "Membuat file .env..."
  cat > "${INSTALL_DIR}/.env" <<ENVEOF
# Bot
BOT_NAME=WGEasyBot
BOT_TOKEN=${BOT_TOKEN}
ADMIN_TELEGRAM_IDS=${ADMIN_IDS}

# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# Payment
PAYMENT_API_KEY=your_pay_xoftware_api_key
PAYMENT_MERCHANT_ID=
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
PAYMENT_BASE_URL=https://pay.xoftware.id

# App
PORT=3000
APP_URL=https://${BOT_DOMAIN}
NODE_ENV=production
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# WG-Easy API
WG_EASY_API_URL=http://localhost:51821
WG_EASY_PASSWORD=${WG_PASSWORD}
ENVEOF

  log "File .env berhasil dibuat"

  # Install dependencies
  info "Menginstall dependencies (npm install)..."
  cd "${INSTALL_DIR}"
  npm install

  # Generate Prisma client
  info "Generating Prisma client..."
  npx prisma generate

  # Run migrations
  info "Running database migrations..."
  npx prisma db push

  log "Bot setup selesai"
}

# Seed database (server location)
seed_database() {
  step "🌍 Setup Server Location"

  # Check if server already exists
  SERVER_COUNT=$(docker exec wgeasy-db psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM \"Server\";" 2>/dev/null | xargs)

  if [ "$SERVER_COUNT" -gt 0 ] 2>/dev/null; then
    log "Server location sudah ada (${SERVER_COUNT} server)"
  else
    info "Menambahkan default server location..."

    # Detect country from IP
    COUNTRY=$(curl -s "http://ip-api.com/json/${PUBLIC_IP}" 2>/dev/null | grep -o '"country":"[^"]*"' | head -1 | cut -d'"' -f4)
    COUNTRY_CODE=$(curl -s "http://ip-api.com/json/${PUBLIC_IP}" 2>/dev/null | grep -o '"countryCode":"[^"]*"' | head -1 | cut -d'"' -f4)
    COUNTRY=${COUNTRY:-"United States"}
    COUNTRY_CODE=${COUNTRY_CODE:-"US"}

    # Convert country code to flag emoji
    FLAG=$(python3 -c "
cc = '${COUNTRY_CODE}'.upper()
print(chr(0x1F1E6 + ord(cc[0]) - ord('A')) + chr(0x1F1E6 + ord(cc[1]) - ord('A')))
" 2>/dev/null || echo "🌐")

    docker exec wgeasy-db psql -U "${DB_USER}" -d "${DB_NAME}" -c "
      INSERT INTO \"Server\" (name, region, flag, host, \"apiUrl\", \"apiPassword\", \"maxPeers\", \"isActive\")
      VALUES ('${COUNTRY_CODE}-1', '${COUNTRY}', '${FLAG}', '${VPN_DOMAIN}', 'http://localhost:51821', '${WG_PASSWORD}', 50, true)
      ON CONFLICT DO NOTHING;
    "

    log "Server location ditambahkan: ${FLAG} ${COUNTRY} (${VPN_DOMAIN})"
  fi
}

# Setup PM2
setup_pm2() {
  step "🚀 Setup PM2 & Start Bot"

  cd "${INSTALL_DIR}"

  # Create ecosystem file
  cat > "${INSTALL_DIR}/ecosystem.config.js" <<'PM2EOF'
module.exports = {
  apps: [{
    name: 'wgeasy',
    script: 'npx',
    args: 'tsx src/index.ts',
    cwd: '/opt/wgeasy',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '300M',
    restart_delay: 3000,
    exp_backoff_restart_delay: 100,
  }]
};
PM2EOF

  # Stop existing if running
  pm2 delete wgeasy 2>/dev/null || true

  # Start
  pm2 start ecosystem.config.js
  pm2 save

  # Setup PM2 startup on boot
  pm2 startup systemd -u root --hp /root 2>/dev/null || true
  pm2 save

  sleep 3

  if pm2 pid wgeasy > /dev/null 2>&1; then
    log "Bot berjalan via PM2!"
  else
    warn "Bot mungkin butuh waktu untuk start. Cek: pm2 logs wgeasy"
  fi
}

# Summary
print_summary() {
  echo ""
  echo -e "${GREEN}"
  echo "╔══════════════════════════════════"
  echo "║"
  echo "║       ✅  INSTALASI SELESAI!  ✅"
  echo "║"
  echo "╚══════════════════════════════════"
  echo -e "${NC}"
  echo ""
  echo -e "${BOLD}📋 Ringkasan:${NC}"
  echo -e "  ${CYAN}├─${NC} 🐳 Docker         : $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',')"
  echo -e "  ${CYAN}├─${NC} 📦 Node.js        : $(node -v)"
  echo -e "  ${CYAN}├─${NC} 🗄️  PostgreSQL     : Container wgeasy-db (port 5432)"
  echo -e "  ${CYAN}├─${NC} 🔐 WG-Easy        : http://localhost:51821"
  echo -e "  ${CYAN}├─${NC} 🤖 Bot            : PM2 process 'wgeasy' (port 3000)"
  echo -e "  ${CYAN}├─${NC} 🌍 VPN Domain     : ${VPN_DOMAIN}"
  echo -e "  ${CYAN}└─${NC} 🔗 Bot Domain     : ${BOT_DOMAIN}"
  echo ""
  echo -e "${BOLD}🔧 Perintah Berguna:${NC}"
  echo -e "  ${YELLOW}pm2 logs wgeasy${NC}          - Lihat log bot"
  echo -e "  ${YELLOW}pm2 restart wgeasy${NC}       - Restart bot"
  echo -e "  ${YELLOW}docker logs wg-easy${NC}      - Lihat log WireGuard"
  echo -e "  ${YELLOW}docker ps${NC}                - Lihat container"
  echo ""
  echo -e "${BOLD}⚠️  Jangan lupa:${NC}"
  echo -e "  1. Setup Cloudflare Tunnel untuk ${VPN_DOMAIN} → localhost:51821"
  echo -e "  2. Setup Cloudflare Tunnel untuk ${BOT_DOMAIN} → localhost:3000"
  echo -e "  3. Set Telegram Webhook ke https://${BOT_DOMAIN}/webhook"
  echo ""
}

# Main
main() {
  banner
  check_root
  collect_input
  install_docker
  install_nodejs
  setup_bot
  setup_database
  setup_wgeasy
  seed_database
  setup_pm2
  print_summary
}

main "$@"
