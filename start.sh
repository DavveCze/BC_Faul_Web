#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  Doporučovací systém závěrečných prací (DSR Artefakt)"
echo "  Autor: David Faul | KIP PřF Ostravská univerzita"
echo "=========================================================="

# 1. Kontrola backendu
if [ ! -d "backend/venv" ]; then
    echo "[1/4] Vytvářím virtuální prostředí Pythonu..."
    python3 -m venv backend/venv
    backend/venv/bin/pip install --upgrade pip
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# 2. Spuštění backendu
echo "[2/4] Spouštím FastAPI backend na http://127.0.0.1:8000..."
PYTHONPATH="$DIR/backend" "$DIR/backend/venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Trap pro ukončení procesů při Ctrl+C
cleanup() {
    echo ""
    echo "Ukončuji servery..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Kontrola frontendu
if [ ! -d "frontend/node_modules" ]; then
    echo "[3/4] Instaluji závislosti frontendu..."
    (cd frontend && npm install)
fi

# 4. Spuštění frontendu
echo "[4/4] Spouštím React frontend na http://localhost:3000..."
(cd frontend && npx vite --port 3000 --host)

