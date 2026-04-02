#!/usr/bin/env bash
set -e

echo "=== Sistema Palha - Setup ==="
echo ""

MODE=${1:-dev}

if [ "$MODE" = "docker" ]; then
  # ── Modo Docker (produção) ─────────────────────────────────────────────────
  echo "[Docker] Verificando .env..."
  if [ ! -f .env ]; then
    cp .env.example .env
    SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
    sed -i "s/mude-este-valor-para-uma-chave-forte-em-producao/$SECRET/" .env
    echo "[Docker] .env criado com JWT_SECRET_KEY gerada automaticamente."
    echo "[AVISO]  Revise o arquivo .env antes de usar em produção."
  fi

  echo "[Docker] Construindo imagens..."
  docker compose build

  echo ""
  echo "Setup Docker concluído! Para iniciar:"
  echo "  docker compose up -d"
  echo ""
  echo "Acesse: http://localhost"
  echo "Login:  admin / palha@2025  (altere após o primeiro acesso)"

else
  # ── Modo desenvolvimento (local) ───────────────────────────────────────────
  echo "[1/3] Criando ambiente virtual Python..."
  cd backend
  python3 -m venv .venv
  source .venv/bin/activate
  echo "[2/3] Instalando dependências do backend..."
  pip install -r requirements.txt -q
  deactivate
  cd ..

  echo "[3/3] Instalando dependências do frontend..."
  cd frontend
  npm install --silent
  cd ..

  echo ""
  echo "Setup concluído! Para iniciar:"
  echo "  Terminal 1: ./start-backend.sh"
  echo "  Terminal 2: ./start-frontend.sh"
  echo ""
  echo "Acesse: http://localhost:5173"
  echo "Login:  admin / palha@2025"
fi
