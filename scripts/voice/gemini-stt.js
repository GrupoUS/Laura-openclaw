/**
 * Gemini STT Client - Speech to Text using Google Gemini
 * 
 * Uses Gemini's audio understanding capabilities for transcription
 */

const https = require('https');

// Load Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ AVISO: A variável de ambiente GEMINI_API_KEY não está definida. O STT falhará.');
}

// Mulaw decode table
const MULAW_DECODE = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  const mu = ~i;
  const sign = (mu & 0x80) ? -1 : 1;
  const exponent = (mu >> 4) & 0x07;
  const mantissa = mu & 0x0F;
  const sample = sign * ((mantissa << 3) + 0x84) << exponent;
  MULAW_DECODE[i] = sample > 32767 ? 32767 : (sample < -32768 ? -32768 : sample);
}

function mulawDecode(byte) {
  return MULAW_DECODE[byte & 0xFF];
}

class GeminiSTT {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.audioBuffer = [];
    this.isProcessing = false;
    
    // Voice Activity Detection settings
    this.silenceThreshold = 500;      // Volume threshold for silence
    this.minSpeechDuration = 400;     // Min ms of speech to consider valid
    this.silenceDuration = 800;       // Ms of silence to trigger processing
    
    this.isSpeaking = false;
    this.speechStart = 0;
    this.lastSpeechTime = 0;
    this.silentChunks = 0;
  }

  /**
   * Calculate RMS volume of audio chunk
   */
  getVolume(chunk) {
    let sum = 0;
    for (let i = 0; i < chunk.length; i++) {
      const sample = mulawDecode(chunk[i]);
      sum += sample * sample;
    }
    return Math.sqrt(sum / chunk.length);
  }

  /**
   * Add audio chunk and detect voice activity
   */
  addAudioChunk(mulawChunk) {
    const volume = this.getVolume(mulawChunk);
    const now = Date.now();
    
    if (volume > this.silenceThreshold) {
      // Speech detected
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.speechStart = now;
        console.log('🎙️ Speech started (volume:', Math.round(volume), ')');
      }
      this.lastSpeechTime = now;
      this.silentChunks = 0;
      this.audioBuffer.push(mulawChunk);
    } else {
      // Silence
      this.silentChunks++;
      
      if (this.isSpeaking) {
        // Still collect some silence after speech
        this.audioBuffer.push(mulawChunk);
      }
    }
  }

  /**
   * Check if we should process (speech ended)
   */
  shouldProcess() {
    if (this.isProcessing || !this.isSpeaking) return false;
    
    const now = Date.now();
    const silenceTime = now - this.lastSpeechTime;
    const speechDuration = this.lastSpeechTime - this.speechStart;
    
    // Process if: enough silence AND enough speech
    if (silenceTime > this.silenceDuration && speechDuration > this.minSpeechDuration) {
      console.log(`🎙️ Speech ended (duration: ${speechDuration}ms, buffer: ${this.audioBuffer.length} chunks)`);
      return true;
    }
    
    return false;
  }

  /**
   * Convert mulaw buffer to WAV for Gemini
   */
  mulawToWav(mulawBuffer) {
    const numSamples = mulawBuffer.length;
    const sampleRate = 8000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    // Convert mulaw to PCM16
    const pcmBuffer = Buffer.alloc(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      const sample = mulawDecode(mulawBuffer[i]);
      pcmBuffer.writeInt16LE(sample, i * 2);
    }
    
    // Create WAV header
    const headerSize = 44;
    const dataSize = pcmBuffer.length;
    const fileSize = headerSize + dataSize - 8;
    
    const wav = Buffer.alloc(headerSize + dataSize);
    
    // RIFF header
    wav.write('RIFF', 0);
    wav.writeUInt32LE(fileSize, 4);
    wav.write('WAVE', 8);
    
    // fmt chunk
    wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(numChannels, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);
    wav.writeUInt16LE(numChannels * bitsPerSample / 8, 32);
    wav.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    wav.write('data', 36);
    wav.writeUInt32LE(dataSize, 40);
    pcmBuffer.copy(wav, 44);
    
    return wav;
  }

  /**
   * Process buffered audio and get transcription
   */
  async processBuffer() {
    if (this.audioBuffer.length === 0 || this.isProcessing) {
      return null;
    }

    this.isProcessing = true;
    
    try {
      // Combine all chunks
      const fullAudio = Buffer.concat(this.audioBuffer);
      
      // Reset state
      this.audioBuffer = [];
      this.isSpeaking = false;
      this.speechStart = 0;
      
      // Skip if too short (less than 0.3s at 8kHz)
      if (fullAudio.length < 2400) {
        console.log('⏭️ Audio too short, skipping');
        return null;
      }
      
      console.log(`🔊 Processing ${fullAudio.length} bytes of audio...`);
      
      // Convert to WAV
      const wavBuffer = this.mulawToWav(fullAudio);
      const audioBase64 = wavBuffer.toString('base64');
      
      // Call Gemini
      const transcription = await this.callGemini(audioBase64);
      
      if (transcription && transcription.trim()) {
        return transcription.trim();
      }
      
      return null;
    } catch (err) {
      console.error('STT Error:', err.message);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Call Gemini API for transcription
   */
  async callGemini(audioBase64) {
    const payload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'audio/wav',
              data: audioBase64
            }
          },
          {
            text: 'Transcreva este áudio em português brasileiro. Retorne APENAS o texto transcrito, sem explicações ou formatação.'
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256
      }
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            resolve(text.trim());
          } catch (e) {
            reject(new Error('Failed to parse Gemini response: ' + e.message));
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Clear buffer
   */
  clear() {
    this.audioBuffer = [];
    this.isProcessing = false;
    this.isSpeaking = false;
  }
}

module.exports = GeminiSTT;
