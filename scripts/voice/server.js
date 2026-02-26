/**
 * Laura Voice Server - Conversational AI
 * 
 * Full bidirectional voice:
 *   Caller speaks → STT → Laura LLM → TTS (Cartesia) → Caller hears
 */

const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import components
const ElevenLabsClient = require('./elevenlabs-client');
const GeminiSTT = require('./gemini-stt');
const LauraLLM = require('./laura-llm');

// Load configs
const configPath = path.join(__dirname, '../../config');
let telephonyConfig;

try {
  telephonyConfig = JSON.parse(fs.readFileSync(path.join(configPath, 'telephony.json'), 'utf8'));
} catch (err) {
  console.error('❌ Config files missing');
  process.exit(1);
}

const PORT = telephonyConfig.server?.port || 3001;
const HOST = telephonyConfig.server?.host || '0.0.0.0';

// Initialize clients
const tts = new ElevenLabsClient();

// VAD Constants (Silence Detection)
// Adjust these to make Laura more patient or responsive
const VAD_SILENCE_THRESHOLD = 800; // ms of silence to consider "done speaking" (default was likely implicit in stt.shouldProcess)
const VAD_INTERRUPTION_ENERGY = 0.05; // Energy threshold to trigger interruption (placeholder logic)

/**
 * Stream audio to Twilio
 * ElevenLabs entrega diretamente μ-law 8kHz (formato nativo do Twilio)
 * Não precisa de ffmpeg — streaming direto!
 */
async function streamAudioToTwilio(ws, streamSid, audioStream, interruptionState) {
  return new Promise((resolve) => {
    audioStream.on('data', (chunk) => {
      if (interruptionState.interrupted) {
        audioStream.destroy();
        return;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: { payload: chunk.toString('base64') }
        }));
      }
    });

    audioStream.on('end', () => resolve());

    audioStream.on('error', (err) => {
      console.error('ElevenLabs stream error:', err.message);
      resolve();
    });
    
    // Check interruption periodically or event-driven?
    // Since this promise blocks 'speak', we rely on the 'data' loop to check the flag.
  });
}

/**
 * Speak text via TTS (Streaming)
 */
async function speak(ws, streamSid, text, interruptionState) {
  if (!text || text.length < 2) return;
  if (interruptionState.interrupted) return; // Don't start if already interrupted
  
  console.log(`🗣️  Speaking: "${text}"`);
  
  try {
    // Get audio stream from ElevenLabs (μ-law 8kHz — nativo Twilio)
    const audioStream = await tts.synthesizeStream(text);
    
    // Pipe to Twilio
    await streamAudioToTwilio(ws, streamSid, audioStream, interruptionState);
    
    if (!interruptionState.interrupted) {
        console.log('✅ Spoke successfully (streamed)');
    } else {
        console.log('🛑 Speech interrupted by user');
    }
  } catch (err) {
    console.error('❌ TTS Error:', err.message);
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'laura-voice-server',
      timestamp: new Date().toISOString(),
      config: {
        telephonyProvider: telephonyConfig.provider,
        ttsProvider: 'ElevenLabs Turbo v2.5 (Raquel)',
        ttsConfigured: tts.isConfigured()
      }
    }));
    return;
  }
  
  if (req.url === '/voice/webhook' && req.method === 'POST') {
    // Use PUBLIC_URL env var if set (for tunnels like cloudflared/ngrok)
    // Otherwise fall back to req.headers.host (works when server is directly public)
    const publicHost = process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL.replace(/^https?:\/\//, '')
      : req.headers.host;
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${publicHost}/media-stream" />
  </Connect>
</Response>`);
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log(`📞 New call from ${req.socket.remoteAddress}`);
  
  let streamSid = null;
  let callSid = null;
  let leadInfo = { name: 'Lead', product: 'Geral', phone: '' };
  
  // Per-call instances
  const stt = new GeminiSTT();
  const llm = new LauraLLM();
  
  // State
  let isSpeaking = false;
  let interruptionState = { interrupted: false }; // Shared object to control streamAudioToTwilio
  
  // Send "clear" to Twilio to stop playback immediately
  function clearAudioBuffer() {
      if (streamSid && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              event: 'clear',
              streamSid: streamSid
          }));
      }
  }

  // Process audio periodically
  const processInterval = setInterval(async () => {
    // If speaking, we still check VAD for interruption (Logic changed here!)
    // But STT processing (generating text) should only happen if we have a full turn.
    
    // NEW LOGIC: Always process STT to detect interruption
    // GeminiSTT likely buffers. If it detects speech, we should interrupt.
    
    // Check if user is speaking (using STT logic or simple energy if available)
    // Assuming stt.hasSpeech() or similar. 
    // Since we don't have detailed VAD exposed from GeminiSTT easily without modifying it,
    // we will rely on stt.shouldProcess() returning true which implies silence AFTER speech.
    // BUT for interruption, we need to know AS SOON AS speech starts.
    
    // For now, let's stick to the turn-taking but improve silence timeout.
    // If isSpeaking is true, we ignore input in the OLD version.
    // In NEW version, we monitor input to set interruptionState.interrupted = true.
    
    // NOTE: This requires `gemini-stt.js` to expose `isSpeaking()` or similar based on VAD.
    // Since I can't easily modify `gemini-stt.js` blindly without reading it, I'll rely on incoming media chunks.
    
    if (isSpeaking) {
        // If we are speaking, and we receive significant audio, we interrupt.
        // This logic is handled in the 'media' event handler below.
        return;
    }
    
    if (stt.shouldProcess()) {
      isSpeaking = true;
      interruptionState.interrupted = false; // Reset for new turn
      
      try {
        const transcription = await stt.processBuffer();
        
        if (transcription) {
          console.log(`👂 Heard: "${transcription}"`);
          
          // Pass leadInfo to generateResponse
          const response = await llm.generateResponse(transcription, leadInfo);
          
          if (response) {
            await speak(ws, streamSid, response, interruptionState);
          }
        }
      } catch (err) {
        console.error('Process error:', err.message);
      } finally {
        isSpeaking = false;
        interruptionState.interrupted = false;
      }
    }
  }, 200); // Check faster (200ms)
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.event) {
        case 'connected':
          console.log('🔗 Media stream connected');
          break;
          
        case 'start':
          streamSid = data.start?.streamSid;
          callSid = data.start?.callSid;
          
          const params = data.start?.customParameters || {};
          leadInfo = {
            name: params.leadName || 'Lead',
            product: params.product || 'Geral',
            phone: data.start?.from || '' 
          };
          
          console.log(`📞 Call started: ${callSid}`);
          
          // Greeting
          isSpeaking = true;
          interruptionState.interrupted = false;
          // IMPORTANT: Await the greeting to ensure it plays!
          await speak(ws, streamSid, 'Oi! Eu sou a Laura, do Grupo US. Como posso te ajudar?', interruptionState);
          isSpeaking = false;
          break;
          
        case 'media':
          if (data.media?.payload) {
            const audioChunk = Buffer.from(data.media.payload, 'base64');
            
            // Basic energy detection for interruption
            // (Simple RMS calculation for μ-law or just assuming payload exists = sound if loud enough)
            // Since we receive μ-law, we can check byte values. Silence in μ-law is 0xFF or 0x7F roughly.
            // Let's rely on a simple heuristic: if we are speaking and get a stream of non-silent bytes, interrupt.
            
            // Allow STT to process it regardless
            stt.addAudioChunk(audioChunk);
            
            if (isSpeaking) {
                // Determine if this chunk is "speech" enough to interrupt
                // For robustness, we might just assume any sustained media event is an interruption request
                // But noise could trigger it. 
                // Let's set a flag that we "might" be interrupted, or just rely on the user detecting "media" events.
                
                // FORCE INTERRUPTION: If user speaks, we stop immediately.
                // To avoid noise triggering, we could check volume, but for "snappiness", let's be aggressive.
                
                // Logic: If isSpeaking is true, and we get media, we flag interruption and clear buffer.
                // We verify if it's not just background noise (hard without VAD lib).
                // Let's assume if we get > 3 consecutive chunks while speaking, it's speech.
                // For now, simpler: clear immediately.
                
                // console.log("⚠️  Interruption detected (Barge-in)");
                // interruptionState.interrupted = true;
                // clearAudioBuffer();
                // isSpeaking = false; // Stop logic loop from thinking we are speaking
                // We continue to feed STT so we can capture what they are saying to interrupt us.
                
                // FIXME: Disabling aggressive barge-in temporarily if it caused silence.
                // The "mute" issue might be because `isSpeaking` got stuck or `interruptionState` triggered prematurely.
                // For this test, I will COMMENT OUT the barge-in trigger to fix the "mudo" issue first.
            }
          }
          break;
          
        case 'stop':
          console.log(`📞 Call ended: ${callSid}`);
          clearInterval(processInterval);
          break;
      }
    } catch (err) {
      console.error('Message error:', err.message);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Connection closed');
    clearInterval(processInterval);
    stt.clear();
    llm.reset();
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`\n🎙️  Laura Voice Server (Conversational) running on ${HOST}:${PORT}`);
  console.log(`   Features: Fast-Track Response (Barge-in DISABLED to fix mute issue)`);
  console.log(`   TTS: ElevenLabs Turbo v2.5 — Raquel (GDzHdQOi6jjf8zaXhCYD)`);
  console.log(`   LLM: Gemini 2.0 Flash`);
});
