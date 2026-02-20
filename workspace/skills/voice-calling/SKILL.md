---
name: voice-calling
description: "Voice calling skill for Laura SDR agent. Enables inbound/outbound phone calls with real-time voice conversation, STT, and TTS."
metadata: {"openclaw":{"emoji":"📞"}}
---

# Voice Calling Skill

Enable Laura to make and receive phone calls for lead qualification.

## Quick Start

```bash
# Start voice server
node /Users/mauricio/.openclaw/scripts/voice/server.js

# Make outbound call
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js call +5562999999999 "Maria" "TRINTAE3"

# Check status
node /Users/mauricio/.openclaw/scripts/voice/outbound-caller.js status
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    LAURA VOICE SYSTEM                         │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Telephony  │◄──►│   Server    │◄──►│   Laura Voice   │  │
│  │  (Twilio)   │    │  (WS/HTTP)  │    │   (Gemini LLM)  │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘  │
│                            │                                  │
│              ┌─────────────┼─────────────┐                   │
│              ▼             ▼             ▼                   │
│        ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│        │   STT    │  │   TTS    │  │   RAG    │             │
│        │(Deepgram)│  │(Inworld) │  │(Existing)│             │
│        └──────────┘  └──────────┘  └──────────┘             │
└──────────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Telephony (Twilio)

Edit `config/telephony.json`:

```json
{
  "provider": "twilio",
  "twilio": {
    "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "authToken": "your_auth_token",
    "phoneNumber": "+5562999999999",
    "webhookUrl": "https://your-server.com/voice/webhook"
  }
}
```

**Setup steps:**
1. Create Twilio account at [twilio.com/console](https://twilio.com/console)
2. Get Account SID and Auth Token
3. Purchase Brazilian phone number (+55)
4. Configure webhook URL pointing to your server

### 2. TTS (Inworld AI)

Edit `config/inworld.json`:

```json
{
  "apiKey": "your_inworld_api_key",
  "tts": {
    "voice": "pt-BR-Female-1",
    "sampleRate": 48000
  }
}
```

**Setup steps:**
1. Create Inworld account at [studio.inworld.ai](https://studio.inworld.ai)
2. Create a project and get API key
3. Optionally configure voice cloning

### 3. STT (Deepgram)

Set environment variable:
```bash
export DEEPGRAM_API_KEY=your_deepgram_key
```

**Setup steps:**
1. Create Deepgram account at [console.deepgram.com](https://console.deepgram.com)
2. Get API key with Nova-2 model access

### 4. LLM (Gemini)

Set environment variable:
```bash
export GEMINI_API_KEY=your_gemini_key
```

## Commands

### Start Server

```bash
node scripts/voice/server.js
```

Server endpoints:
- `GET /health` - Health check
- `POST /voice/webhook` - Twilio incoming call webhook
- `WS /media-stream` - Audio streaming WebSocket

### Make Outbound Call

```bash
node scripts/voice/outbound-caller.js call <phone> [name] [product]
```

Examples:
```bash
# Call with lead info
node scripts/voice/outbound-caller.js call +5562999999999 "Maria" "TRINTAE3"

# Add to queue for later
node scripts/voice/outbound-caller.js add +5562888888888 "João" "NEON"

# Process queue
node scripts/voice/outbound-caller.js queue

# Check status
node scripts/voice/outbound-caller.js status
```

### Test Components

```bash
# Test TTS
node scripts/voice/inworld-client.js "Olá, eu sou a Laura!"

# Test STT (requires DEEPGRAM_API_KEY)
node scripts/voice/stt-handler.js

# Test Laura conversation
node scripts/voice/laura-voice.js
```

## Business Hours

Outbound calls are restricted to:
- **Hours:** 9:00 AM - 6:00 PM (BRT)
- **Days:** Monday to Friday
- **Rate limit:** 10 calls per hour

## Expressivity Tags

Laura's voice supports emotional tags:

| Tag | Effect |
|-----|--------|
| `[happy]` | Cheerful tone |
| `[calm]` | Relaxed, soothing |
| `[excited]` | Enthusiastic |
| `[sad]` | Empathetic |
| `[laughing]` | Light laugh |
| `[whispering]` | Quiet, intimate |
| `[sigh]` | Exasperated |

Example response:
```
[happy] Oi Maria! Eu sou a Laura do Grupo US. [excited] Vi que você tem interesse no TRINTAE3!
```

## Files

| File | Purpose |
|------|---------|
| `scripts/voice/server.js` | Main WebSocket/HTTP server |
| `scripts/voice/laura-voice.js` | Conversation logic with Gemini |
| `scripts/voice/telephony.js` | Twilio/Voximplant abstraction |
| `scripts/voice/outbound-caller.js` | Outbound call management |
| `scripts/voice/stt-handler.js` | Deepgram STT integration |
| `scripts/voice/inworld-client.js` | Inworld TTS integration |
| `config/telephony.json` | Telephony provider config |
| `config/inworld.json` | Inworld TTS config |

## Troubleshooting

### "Telephony not configured"
→ Edit `config/telephony.json` with valid Twilio credentials

### "Inworld API key not configured"
→ Edit `config/inworld.json` with your Inworld API key

### "DEEPGRAM_API_KEY not set"
→ Export environment variable: `export DEEPGRAM_API_KEY=your_key`

### "Outside business hours"
→ Calls only work 9AM-6PM BRT, Mon-Fri. Use `add` to queue for later.

### Audio quality issues
→ Check network latency; consider upgrading VPS if CPU-bound

### Lead not understanding Laura
→ STT may need tuning; check Deepgram dashboard for accuracy metrics

## Integration with SDR Flow

Laura follows the SDR flow from `SOUL.md`:
1. **Greeting** → Friendly intro with lead name if available
2. **Qualification** → Identify profession, needs
3. **Product pitch** → Match to TRINTAE3, NEON, UP etc.
4. **Objection handling** → Price, time, credibility
5. **Collection** → Get email, schedule follow-up
6. **Handoff** → Transfer to Lucas if needed

## Next Steps

1. [ ] Configure Twilio with Brazilian number
2. [ ] Set up Inworld API key
3. [ ] Deploy server with HTTPS
4. [ ] Test inbound call flow
5. [ ] Test outbound call to personal number
6. [ ] Integrate with lead queue
