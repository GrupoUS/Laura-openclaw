#!/bin/zsh
# Laura Voice Server — Start Script
# Uso: ./start.sh

set -e

VOICE_DIR="$(cd "$(dirname "$0")" && pwd)"
GEMINI_API_KEY="AIzaSyCXo_X_V__07F9fugV67rFbVm2Gpw0-2Qs"

echo "🎙️ Iniciando Laura Voice Server..."

# Kill processos anteriores
pkill -f "voice/server.js" 2>/dev/null || true
pkill -f "ngrok http 3001" 2>/dev/null || true
sleep 2

# Start ngrok
ngrok http 3001 --log stdout > /tmp/ngrok-voice.log 2>&1 &
echo "⏳ Aguardando ngrok..."
sleep 6

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import json,sys; t=json.load(sys.stdin); print(t['tunnels'][0]['public_url'])" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Falha ao obter URL do ngrok"
  exit 1
fi

echo "🌐 Tunnel: $NGROK_URL"

# Update telephony.json webhook URL
python3 -c "
import json
with open('$VOICE_DIR/../../config/telephony.json') as f: cfg=json.load(f)
cfg['twilio']['webhookUrl']='$NGROK_URL/voice/webhook'
with open('$VOICE_DIR/../../config/telephony.json','w') as f: json.dump(cfg,f,indent=4)
print('✅ telephony.json atualizado')
"

# Start voice server
cd "$VOICE_DIR"
GEMINI_API_KEY="$GEMINI_API_KEY" PUBLIC_URL="$NGROK_URL" node server.js > /tmp/laura-voice.log 2>&1 &
echo "✅ Voice server iniciado (PID: $!)"
echo "📋 Logs: tail -f /tmp/laura-voice.log"
echo ""
echo "📞 Para ligar:"
echo "   node $VOICE_DIR/outbound-caller.js call +55XXXXXXXXXXX 'Nome' 'TRINTAE3'"
