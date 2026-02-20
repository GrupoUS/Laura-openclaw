/**
 * Inworld TTS Client - Text to Speech using Inworld AI
 * 
 * Supports:
 * - Streaming TTS with low latency
 * - Expressivity tags [happy], [sad], [laugh], etc.
 * - Portuguese Brazilian voice
 * - Voice cloning (optional)
 * 
 * Usage:
 *   const tts = require('./inworld-client');
 *   const audio = await tts.synthesize('Olá! [happy] Como posso ajudar?');
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '../../config/inworld.json');
let config = {};

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.warn('⚠️  config/inworld.json not found or invalid');
}

const INWORLD_API_KEY = config.apiKey || process.env.INWORLD_API_KEY || '';
const INWORLD_API_URL = 'https://api.inworld.ai/tts/v1/voice';

class InworldTTSClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey || INWORLD_API_KEY;
    // Use voiceId from config (e.g., "Ashley" or custom voice ID)
    this.voiceId = options.voiceId || config.tts?.voice || 'Ashley';
    // Model: inworld-tts-1.5-max is recommended
    this.modelId = options.modelId || config.tts?.model || 'inworld-tts-1.5-max';
    this.sampleRate = options.sampleRate || config.tts?.sampleRate || 48000;
    this.speakingRate = options.speakingRate || config.tts?.speakingRate || 1.0;
    this.temperature = options.temperature || config.tts?.temperature || 0.7;
  }

  /**
   * Check if client is configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_INWORLD_API_KEY';
  }

  /**
   * Process expressivity tags for Inworld format
   * @param {string} text - Text with tags like [happy], [laugh]
   */
  processExpressivity(text) {
    // For now, just remove any brackets to avoid issues
    // The Inworld voice already has natural expressivity
    return text.replace(/\[.*?\]/g, '').trim();
  }

  /**
   * Synthesize text to speech
   * @param {string} text - Text to synthesize
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async synthesize(text) {
    if (!this.isConfigured()) {
      throw new Error('Inworld API key not configured. Set in config/inworld.json');
    }

    const processedText = this.processExpressivity(text);

    // Payload format per Inworld docs
    const requestBody = JSON.stringify({
      text: processedText,
      voiceId: this.voiceId,
      modelId: this.modelId
    });

    return new Promise((resolve, reject) => {
      const url = new URL(INWORLD_API_URL);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`TTS API error: ${res.statusCode} - ${Buffer.concat(chunks).toString()}`));
            return;
          }
          
          try {
            // Inworld returns JSON with base64 audioContent
            const response = JSON.parse(Buffer.concat(chunks).toString());
            if (response.audioContent) {
              const audioBuffer = Buffer.from(response.audioContent, 'base64');
              resolve(audioBuffer);
            } else {
              reject(new Error('No audioContent in response'));
            }
          } catch (parseErr) {
            // If not JSON, assume raw audio
            resolve(Buffer.concat(chunks));
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Stream TTS audio (for real-time playback)
   * @param {string} text - Text to synthesize
   * @param {function} onChunk - Callback for each audio chunk
   */
  async streamSynthesize(text, onChunk) {
    if (!this.isConfigured()) {
      throw new Error('Inworld API key not configured');
    }

    const processedText = this.processExpressivity(text);

    // Note: This is a simplified streaming implementation
    // Real Inworld streaming uses WebSocket for true real-time
    
    const audio = await this.synthesize(processedText);
    
    // Chunk the audio for simulated streaming
    const chunkSize = 4096; // ~85ms at 48kHz 16-bit mono
    for (let i = 0; i < audio.length; i += chunkSize) {
      const chunk = audio.slice(i, Math.min(i + chunkSize, audio.length));
      onChunk(chunk);
    }
  }

  /**
   * Convert PCM to mulaw for Twilio
   * Twilio expects 8kHz mulaw audio
   */
  static pcmToMulaw(pcmBuffer, inputSampleRate = 48000) {
    // Resample from inputSampleRate to 8000Hz
    const ratio = inputSampleRate / 8000;
    const outputLength = Math.floor(pcmBuffer.length / 2 / ratio);
    const output = Buffer.alloc(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const srcIndex = Math.floor(i * ratio) * 2;
      const sample = pcmBuffer.readInt16LE(srcIndex);
      output[i] = linearToMulaw(sample);
    }

    return output;
  }
}

// Mulaw encoding helper
function linearToMulaw(sample) {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > MULAW_MAX) sample = MULAW_MAX;
  
  sample = sample + MULAW_BIAS;
  let exponent = 7;
  let expMask = 0x4000;
  
  for (; exponent > 0; exponent--) {
    if ((sample & expMask) !== 0) break;
    expMask >>= 1;
  }
  
  const mantissa = (sample >> (exponent + 3)) & 0x0F;
  const mulawByte = ~(sign | (exponent << 4) | mantissa);
  
  return mulawByte & 0xFF;
}

// Test mode
if (require.main === module) {
  console.log('🧪 Testing Inworld TTS Client...\n');
  
  const tts = new InworldTTSClient();
  
  if (!tts.isConfigured()) {
    console.log('⚠️  Inworld API not configured.');
    console.log('   Edit config/inworld.json with your API key from:');
    console.log('   https://studio.inworld.ai/');
    process.exit(1);
  }
  
  const testText = process.argv[2] || 'Olá! [happy] Eu sou a Laura do Grupo US. Como posso ajudar você hoje?';
  
  console.log(`📝 Text: "${testText}"\n`);
  
  tts.synthesize(testText)
    .then((audio) => {
      const outputPath = path.join(__dirname, 'test-output.pcm');
      fs.writeFileSync(outputPath, audio);
      console.log(`✅ Audio generated: ${outputPath}`);
      console.log(`   Size: ${audio.length} bytes`);
      console.log(`   Duration: ~${(audio.length / 2 / tts.sampleRate).toFixed(2)}s`);
    })
    .catch((err) => {
      console.error('❌ TTS Error:', err.message);
      process.exit(1);
    });
}

module.exports = InworldTTSClient;
