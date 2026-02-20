/**
 * Laura LLM Client - Generate responses using Gemini
 * 
 * Uses the same persona as the WhatsApp Laura
 * Now with Tool execution for scheduling!
 */

const https = require('https');
const { spawn } = require('child_process');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCl39UHQTiRoc_iyhhHwtn7oYdbvgt7F04';

const LAURA_SYSTEM_PROMPT = `Você é a Laura, atendente e SDR do Grupo US.

REGRAS DE CONVERSA:
- Fale em português brasileiro, com frases CURTAS (máx 2 frases por resposta)
- Tom amigável, profissional e direto
- Você está em uma LIGAÇÃO TELEFÔNICA - seja breve
- NÃO use emojis na fala

OBJETIVO:
- Qualificar leads e agendar calls com o closer Lucas.
- Se o cliente concordar com um horário, CONFIRME e AGENDE usando o comando especial.

COMANDO DE AGENDAMENTO (IMPORTANTE):
Quando o cliente confirmar um horário, sua resposta DEVE incluir o comando:
[AGENDAR: YYYY-MM-DDTHH:MM:00]

Exemplo: "Perfeito! [AGENDAR: 2026-02-04T14:00:00] Marquei para amanhã às 14h com o Lucas."

PRODUTOS: TRINTAE3, NEON, OTB, COMU US.
Data atual para referência: ${new Date().toISOString().split('T')[0]} (YYYY-MM-DD)
Horário atual: ${new Date().toLocaleTimeString('pt-BR')} (Brasília)
`;

class LauraLLM {
  constructor() {
    this.conversationHistory = [];
  }

  /**
   * Execute system commands found in text
   */
  async executeCommands(text, leadInfo = {}) {
    const scheduleRegex = /\[AGENDAR: (.*?)\]/;
    const match = text.match(scheduleRegex);
    
    if (match) {
      const dateTime = match[1];
      console.log(`📅 Detectado agendamento para: ${dateTime}`);
      
      try {
        // 1. Agendar no Google Calendar
        const leadName = leadInfo.name || 'Lead (Voz)';
        const leadPhone = leadInfo.phone || 'N/A';
        const leadEmail = 'lead.voz@exemplo.com'; // Placeholder se não tiver
        
        console.log(`📅 Executando script de agendamento...`);
        
        // Execute schedule-call.js
        const scriptPath = path.join(__dirname, '../../scripts/schedule-call.js');
        
        // node schedule-call.js criar "Nome" "Phone" "Email" "Data" "Produto"
        const child = spawn('node', [
          scriptPath, 
          'criar',
          leadName,
          leadPhone,
          leadEmail,
          dateTime,
          leadInfo.product || 'Interesse Geral'
        ]);
        
        child.stdout.on('data', (data) => console.log(`📅 Calendar: ${data}`));
        child.stderr.on('data', (data) => console.error(`📅 Calendar Err: ${data}`));
        
        // 2. Avisar o Lucas no WhatsApp
        console.log(`💬 Avisando Lucas no WhatsApp...`);
        const msgText = `🔔 *Novo Agendamento via Voz (Laura)*\n\n👤 *Nome:* ${leadName}\n📞 *Tel:* ${leadPhone}\n📅 *Data:* ${dateTime}\n🚀 *Produto:* ${leadInfo.product || 'Geral'}`;
        
        // Usar CLI do OpenClaw para enviar mensagem
        const msgCmd = spawn('openclaw', [
          'message', 
          'send', 
          '--to', '556195220319@s.whatsapp.net', // Lucas
          '--message', msgText
        ]);
        
        msgCmd.stdout.on('data', (data) => console.log(`💬 Msg Sent: ${data}`));
        
      } catch (err) {
        console.error('❌ Erro ao executar agendamento:', err);
      }
      
      // Retorna o texto limpo sem o comando para ser falado
      return text.replace(scheduleRegex, '').trim();
    }
    
    return text;
  }

  /**
   * Generate a response from Laura
   */
  async generateResponse(userMessage, leadInfo = {}) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Keep only last 10 messages
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }

    const payload = {
      system_instruction: {
        parts: [{ text: LAURA_SYSTEM_PROMPT }]
      },
      contents: this.conversationHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150
      }
    };

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          try {
            const response = JSON.parse(data);
            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Add raw text (with commands) to history so model knows it outputted it
            if (rawText) {
              this.conversationHistory.push({
                role: 'model',
                parts: [{ text: rawText }]
              });
            }
            
            // Execute commands and get clean text for TTS
            const cleanText = await this.executeCommands(rawText, leadInfo);
            
            resolve(cleanText);
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
   * Reset conversation
   */
  reset() {
    this.conversationHistory = [];
  }
}

module.exports = LauraLLM;
