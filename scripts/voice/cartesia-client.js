/**
 * Cartesia TTS Client - Text to Speech using Cartesia Sonic 3
 * 
 * Uses Cartesia's ultra-fast Sonic 3 model
 */

const https = require('https');

// Cartesia Configuration
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY || 'sk_car_oGm2y3Ccpk8qyq2tAc1uJZ';
const VOICE_ID = 'f9b392a5-f293-4d9c-8c07-f0fb2bbee555'; // Voz Sacha
const MODEL_ID = 'sonic-3';

class CartesiaClient {
  constructor() {
    this.apiKey = CARTESIA_API_KEY;
    this.voiceId = VOICE_ID;
    this.modelId = MODEL_ID;
  }

  /**
   * Check if client is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Synthesize text to speech (Streaming)
   * @param {string} text - Text to synthesize
   * @returns {Promise<IncomingMessage>} - HTTP Response stream
   */
  async synthesizeStream(text) {
    if (!this.isConfigured()) {
      throw new Error('Cartesia API key not configured');
    }

    const payload = {
      model_id: this.modelId,
      transcript: text,
      voice: {
        mode: 'id',
        id: this.voiceId
      },
      language: 'pt',
      output_format: {
        container: 'wav',
        encoding: 'pcm_f32le',
        sample_rate: 44100
      },
      speed: 'normal',
      generation_config: {
        speed: 1,
        volume: 1
      }
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.cartesia.ai',
        path: '/tts/bytes',
        method: 'POST',
        headers: {
          'Cartesia-Version': '2025-04-16',
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
           reject(new Error(`Cartesia API stream error: ${res.statusCode}`));
           return;
        }
        resolve(res);
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Synthesize text to speech
   * @param {string} text - Text to synthesize
   * @returns {Promise<Buffer>} - WAV audio buffer
   */
  async synthesize(text) {
    if (!this.isConfigured()) {
      throw new Error('Cartesia API key not configured');
    }

    const payload = {
      model_id: this.modelId,
      transcript: text,
      voice: {
        mode: 'id',
        id: this.voiceId
      },
      language: 'pt',
      output_format: {
        container: 'wav',
        encoding: 'pcm_f32le',
        sample_rate: 44100
      },
      speed: 'normal',
      generation_config: {
        speed: 1,
        volume: 1
      }
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.cartesia.ai',
        path: '/tts/bytes',
        method: 'POST',
        headers: {
          'Cartesia-Version': '2025-04-16',
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on('data', chunk => chunks.push(chunk));
        
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Cartesia API error: ${res.statusCode} - ${Buffer.concat(chunks).toString()}`));
            return;
          }
          
          resolve(Buffer.concat(chunks));
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

module.exports = CartesiaClient;
