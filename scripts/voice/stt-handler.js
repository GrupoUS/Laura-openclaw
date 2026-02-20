/**
 * STT Handler - Speech to Text processing
 * 
 * Uses Deepgram for real-time transcription
 * Falls back to existing transcribe.js (Gemini) for non-realtime
 * 
 * Usage:
 *   const stt = require('./stt-handler');
 *   stt.transcribeStream(audioStream, (text) => console.log(text));
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Deepgram config (real-time STT)
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const DEEPGRAM_URL = 'wss://api.deepgram.com/v1/listen';

class STTHandler {
  constructor(options = {}) {
    this.language = options.language || 'pt-BR';
    this.model = options.model || 'nova-2';
    this.ws = null;
    this.onTranscript = options.onTranscript || (() => {});
    this.onError = options.onError || console.error;
  }

  /**
   * Connect to Deepgram for real-time transcription
   */
  connect() {
    if (!DEEPGRAM_API_KEY) {
      console.warn('⚠️  DEEPGRAM_API_KEY not set. STT will not work.');
      return false;
    }

    const params = new URLSearchParams({
      model: this.model,
      language: this.language,
      punctuate: 'true',
      interim_results: 'true',
      encoding: 'mulaw',
      sample_rate: '8000',
      channels: '1'
    });

    this.ws = new WebSocket(`${DEEPGRAM_URL}?${params}`, {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`
      }
    });

    this.ws.on('open', () => {
      console.log('🎤 STT connected to Deepgram');
    });

    this.ws.on('message', (data) => {
      try {
        const response = JSON.parse(data);
        const transcript = response.channel?.alternatives?.[0]?.transcript;
        const isFinal = response.is_final;

        if (transcript && isFinal) {
          this.onTranscript(transcript, { isFinal });
        }
      } catch (err) {
        this.onError('STT parse error:', err);
      }
    });

    this.ws.on('error', (err) => {
      this.onError('STT WebSocket error:', err);
    });

    this.ws.on('close', () => {
      console.log('🎤 STT disconnected');
    });

    return true;
  }

  /**
   * Send audio data for transcription
   * @param {Buffer} audioData - Raw audio bytes (mulaw 8kHz from Twilio)
   */
  sendAudio(audioData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  /**
   * Close the STT connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Transcribe a file using existing Gemini-based transcriber
   * (Non-realtime fallback)
   */
  async transcribeFile(filePath) {
    const transcribePath = path.join(__dirname, '../transcribe.js');
    
    if (!fs.existsSync(transcribePath)) {
      throw new Error('transcribe.js not found');
    }

    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec(`node ${transcribePath} "${filePath}"`, (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }
}

// Test mode
if (require.main === module) {
  console.log('🧪 Testing STT Handler...');
  
  if (!DEEPGRAM_API_KEY) {
    console.log('⚠️  Set DEEPGRAM_API_KEY to test real-time STT');
    console.log('   Example: export DEEPGRAM_API_KEY=your_key_here');
    process.exit(1);
  }
  
  const stt = new STTHandler({
    onTranscript: (text, meta) => {
      console.log(`📝 Transcript: "${text}" (final: ${meta.isFinal})`);
    }
  });
  
  if (stt.connect()) {
    console.log('✅ STT Handler ready');
    
    // Keep alive for testing
    setTimeout(() => {
      stt.close();
      console.log('🔌 Test complete');
    }, 5000);
  }
}

module.exports = STTHandler;
