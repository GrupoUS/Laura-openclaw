/**
 * Laura Voice - Conversational Logic
 * 
 * Integrates:
 * - Laura persona from SOUL.md / SDR.md
 * - STT for user input
 * - LLM (Gemini) for responses
 * - TTS for voice output
 * - RAG for knowledge base
 * 
 * Usage:
 *   const laura = require('./laura-voice');
 *   const response = await laura.processInput('Quero saber sobre o TRINTAE3');
 */

const fs = require('fs');
const path = require('path');

// Import local modules
const STTHandler = require('./stt-handler');
const InworldTTSClient = require('./inworld-client');

// Load Laura's persona
const SOUL_PATH = path.join(__dirname, '../../SOUL.md');
const SDR_PATH = path.join(__dirname, '../../agents/SDR.md');

let lauraPersona = '';
try {
  lauraPersona = fs.readFileSync(SOUL_PATH, 'utf8');
} catch (err) {
  console.warn('⚠️  SOUL.md not found');
}

// Gemini API config
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

class LauraVoice {
  constructor(options = {}) {
    this.tts = new InworldTTSClient(options.tts);
    this.stt = new STTHandler({
      language: 'pt-BR',
      onTranscript: (text) => this.handleTranscript(text),
      ...options.stt
    });
    
    this.conversationHistory = [];
    this.leadInfo = options.leadInfo || {};
    this.onResponse = options.onResponse || (() => {});
    this.onAudio = options.onAudio || (() => {});
    
    // Rate limiting for responses
    this.lastResponseTime = 0;
    this.minResponseInterval = 1000; // 1 second minimum between responses
  }

  /**
   * Get system prompt for Laura
   */
  getSystemPrompt() {
    return `${lauraPersona}

## MODO VOZ (ADICIONAL)

Você está em uma ligação telefônica. Regras adicionais:
- Fale de forma NATURAL e CONVERSACIONAL
- Frases CURTAS (máximo 2 sentenças por vez)
- Use expressividade: [happy], [calm], [excited] quando apropriado
- Se não entender, diga "Desculpa, não entendi. Pode repetir?"
- Se o lead ficar em silêncio 5s, faça uma pergunta de follow-up
- NUNCA diga "como posso ajudar" - seja proativa

## CONTEXTO DO LEAD
${this.leadInfo.name ? `- Nome: ${this.leadInfo.name}` : '- Nome: não informado'}
${this.leadInfo.phone ? `- Telefone: ${this.leadInfo.phone}` : ''}
${this.leadInfo.source ? `- Origem: ${this.leadInfo.source}` : ''}
`;
  }

  /**
   * Generate opening greeting
   */
  getGreeting() {
    const greetings = [
      '[happy] Oi! Eu sou a Laura, do Grupo US. Tudo bem?',
      '[friendly] Olá! Aqui é a Laura, do Grupo US. Como você está?',
      '[warm] Oi! Laura aqui, do Grupo US. Que bom falar com você!'
    ];
    
    if (this.leadInfo.name) {
      return `[happy] Oi ${this.leadInfo.name}! Eu sou a Laura, do Grupo US. Tudo bem com você?`;
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Handle incoming transcript from STT
   */
  async handleTranscript(text) {
    const now = Date.now();
    if (now - this.lastResponseTime < this.minResponseInterval) {
      return; // Rate limit
    }
    
    console.log(`📝 User said: "${text}"`);
    
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    });

    try {
      // Generate response using LLM
      const response = await this.generateResponse(text);
      this.lastResponseTime = Date.now();
      
      console.log(`🗣️  Laura: "${response}"`);
      
      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      // Notify listeners
      this.onResponse(response);

      // Generate TTS audio
      if (this.tts.isConfigured()) {
        const audio = await this.tts.synthesize(response);
        this.onAudio(audio);
      }

      return response;
    } catch (err) {
      console.error('Error generating response:', err);
      const fallback = 'Desculpa, tive um probleminha. Pode repetir?';
      this.onResponse(fallback);
      return fallback;
    }
  }

  /**
   * Generate response using Gemini
   */
  async generateResponse(userInput) {
    if (!GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set');
      return this.getFallbackResponse(userInput);
    }

    const messages = this.conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const requestBody = JSON.stringify({
      contents: messages,
      systemInstruction: {
        parts: [{ text: this.getSystemPrompt() }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150, // Keep responses short for voice
        topP: 0.9
      }
    });

    return new Promise((resolve, reject) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      
      const https = require('https');
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
              resolve(text.trim());
            } else {
              reject(new Error('No response from Gemini'));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Fallback responses when LLM is unavailable
   */
  getFallbackResponse(input) {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('preço') || lowerInput.includes('valor') || lowerInput.includes('quanto')) {
      return 'Por aqui eu não passo valores. Posso te colocar com nosso especialista. Qual seu melhor e-mail?';
    }
    
    if (lowerInput.includes('trintae3') || lowerInput.includes('pós') || lowerInput.includes('curso')) {
      return '[excited] O TRINTAE3 é nossa pós em Saúde Estética Avançada! Você é formado em alguma área da saúde?';
    }
    
    if (lowerInput.includes('neon') || lowerInput.includes('mentoria')) {
      return '[calm] O NEON é nossa mentoria individualizada para quem quer escalar a clínica. Você já tem sua clínica?';
    }
    
    return '[friendly] Me conta mais! O que você gostaria de saber sobre nossos cursos?';
  }

  /**
   * Check if lead wants human handoff
   */
  needsHumanHandoff(input) {
    const triggers = [
      'falar com humano',
      'pessoa real',
      'atendente',
      'falar com alguém',
      'reclamação',
      'insatisfeito',
      'problema'
    ];
    
    const lowerInput = input.toLowerCase();
    return triggers.some(t => lowerInput.includes(t));
  }

  /**
   * Start a voice session
   */
  startSession() {
    console.log('🎙️  Laura voice session started');
    this.stt.connect();
    return this.getGreeting();
  }

  /**
   * End the voice session
   */
  endSession() {
    this.stt.close();
    console.log('🎙️  Laura voice session ended');
    
    // Return conversation summary
    return {
      duration: this.conversationHistory.length > 0 
        ? new Date() - new Date(this.conversationHistory[0].timestamp)
        : 0,
      messageCount: this.conversationHistory.length,
      leadInfo: this.leadInfo,
      history: this.conversationHistory
    };
  }

  /**
   * Process incoming audio chunk
   */
  processAudio(audioData) {
    this.stt.sendAudio(audioData);
  }
}

// Test mode
if (require.main === module) {
  console.log('🧪 Testing Laura Voice...\n');
  
  const laura = new LauraVoice({
    leadInfo: { name: 'Maria', source: 'Instagram' },
    onResponse: (text) => console.log(`\n💬 Response: ${text}\n`)
  });
  
  console.log('📞 Greeting:', laura.getGreeting());
  
  // Simulate conversation
  const testInputs = [
    'Oi! Quero saber sobre os cursos',
    'Sou fisioterapeuta',
    'Quanto custa?'
  ];
  
  (async () => {
    for (const input of testInputs) {
      console.log(`\n👤 User: ${input}`);
      await laura.handleTranscript(input);
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('\n📊 Session Summary:', laura.endSession());
  })();
}

module.exports = LauraVoice;
