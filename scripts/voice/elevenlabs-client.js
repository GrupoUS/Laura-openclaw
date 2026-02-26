/**
 * ElevenLabs TTS Client — Voz Raquel
 *
 * Usa ElevenLabs Turbo v2.5 (baixa latência) com a voz da Raquel
 * para streaming de áudio nas ligações via Twilio.
 */

const https = require('https');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_f989ef9c49b4bbd8a61c2349ce096c3097c6f3dc8b51b930';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'GDzHdQOi6jjf8zaXhCYD'; // Raquel
const MODEL_ID = 'eleven_turbo_v2_5'; // Melhor latência para chamadas em tempo real

class ElevenLabsClient {
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY;
    this.voiceId = VOICE_ID;
    this.modelId = MODEL_ID;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Synthesize text to speech (streaming response)
   * Returns a Node.js IncomingMessage (readable stream) with PCM/WAV audio.
   *
   * @param {string} text - Text to synthesize
   * @returns {Promise<IncomingMessage>} - HTTP Response stream (mp3 audio)
   */
  async synthesizeStream(text) {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const payload = JSON.stringify({
      text,
      model_id: this.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
      // Output format: ulaw_8000 é o formato nativo do Twilio (8kHz μ-law)
      // Isso evita a necessidade de ffmpeg para conversão!
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${this.voiceId}/stream?output_format=ulaw_8000`,
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Accept': 'audio/basic', // μ-law audio
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => reject(new Error(`ElevenLabs ${res.statusCode}: ${body.slice(0, 200)}`)));
          return;
        }
        resolve(res);
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}

module.exports = ElevenLabsClient;
