/**
 * Telephony Abstraction - Twilio / Voximplant
 * 
 * Provides unified interface for:
 * - Making outbound calls
 * - Receiving inbound calls
 * - Managing call state
 * 
 * Usage:
 *   const telephony = require('./telephony');
 *   await telephony.call('+5562999999999', { leadName: 'Maria' });
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load config
const configPath = path.join(__dirname, '../../config/telephony.json');
let config = {};

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.warn('⚠️  config/telephony.json not found');
}

class TelephonyProvider {
  constructor() {
    this.provider = config.provider || 'twilio';
    this.config = config[this.provider] || {};
    this.serverConfig = config.server || { port: 3001 };
  }

  /**
   * Check if provider is configured
   */
  isConfigured() {
    if (this.provider === 'twilio') {
      return this.config.accountSid && 
             this.config.accountSid !== 'YOUR_TWILIO_ACCOUNT_SID' &&
             this.config.authToken;
    }
    if (this.provider === 'voximplant') {
      return this.config.accountId && 
             this.config.accountId !== 'YOUR_VOXIMPLANT_ACCOUNT_ID' &&
             this.config.apiKey;
    }
    return false;
  }

  /**
   * Make an outbound call
   * @param {string} to - Phone number to call (+55...)
   * @param {object} options - Call options
   */
  async call(to, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(`${this.provider} not configured. Edit config/telephony.json`);
    }

    console.log(`📞 Initiating call to ${to} via ${this.provider}`);

    if (this.provider === 'twilio') {
      return this.twilioCall(to, options);
    }
    
    if (this.provider === 'voximplant') {
      return this.voximplantCall(to, options);
    }

    throw new Error(`Unknown provider: ${this.provider}`);
  }

  /**
   * Make call via Twilio
   */
  async twilioCall(to, options = {}) {
    const { accountSid, authToken, phoneNumber, webhookUrl } = this.config;
    
    const twiml = options.twiml || `
      <Response>
        <Say voice="alice" language="pt-BR">
          Olá! Aguarde enquanto conectamos você com a Laura.
        </Say>
        <Connect>
          <Stream url="${webhookUrl.replace('https://', 'wss://').replace('/voice/webhook', '/media-stream')}">
            <Parameter name="leadName" value="${options.leadName || 'Lead'}" />
            <Parameter name="product" value="${options.product || 'Geral'}" />
          </Stream>
        </Connect>
      </Response>
    `;

    const params = new URLSearchParams({
      To: to,
      From: phoneNumber,
      Twiml: twiml
    });

    return new Promise((resolve, reject) => {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${accountSid}/Calls.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const call = JSON.parse(data);
            console.log(`✅ Call initiated: ${call.sid}`);
            resolve(call);
          } else {
            reject(new Error(`Twilio error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(params.toString());
      req.end();
    });
  }

  /**
   * Make call via Voximplant
   */
  async voximplantCall(to, options = {}) {
    const { accountId, apiKey, applicationId } = this.config;
    
    // Voximplant uses scenarios in VoxEngine
    // This initiates a call that runs the configured scenario
    
    const requestBody = JSON.stringify({
      account_id: accountId,
      application_id: applicationId,
      phone_number: to,
      custom_data: JSON.stringify(options)
    });

    return new Promise((resolve, reject) => {
      const url = new URL('https://api.voximplant.com/platform_api/StartScenarios');
      url.searchParams.set('account_id', accountId);
      url.searchParams.set('api_key', apiKey);
      
      const reqOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const result = JSON.parse(data);
            console.log(`✅ Call initiated via Voximplant`);
            resolve(result);
          } else {
            reject(new Error(`Voximplant error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });
  }

  /**
   * Get call status
   */
  async getCallStatus(callId) {
    if (this.provider === 'twilio') {
      const { accountSid, authToken } = this.config;
      
      return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        
        const options = {
          hostname: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${accountSid}/Calls/${callId}.json`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Error: ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.end();
      });
    }

    throw new Error('getCallStatus not implemented for ' + this.provider);
  }

  /**
   * End a call
   */
  async endCall(callId) {
    if (this.provider === 'twilio') {
      const { accountSid, authToken } = this.config;
      
      return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        
        const params = new URLSearchParams({ Status: 'completed' });
        
        const options = {
          hostname: 'api.twilio.com',
          path: `/2010-04-01/Accounts/${accountSid}/Calls/${callId}.json`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Error: ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.write(params.toString());
        req.end();
      });
    }

    throw new Error('endCall not implemented for ' + this.provider);
  }
}

// Singleton instance
const telephony = new TelephonyProvider();

// Test mode
if (require.main === module) {
  console.log('🧪 Testing Telephony Provider...\n');
  
  console.log(`Provider: ${telephony.provider}`);
  console.log(`Configured: ${telephony.isConfigured() ? '✅ Yes' : '⚠️ No'}`);
  
  if (!telephony.isConfigured()) {
    console.log('\n⚠️  Please configure config/telephony.json with your credentials.');
    console.log('\nFor Twilio:');
    console.log('  1. Get Account SID and Auth Token from console.twilio.com');
    console.log('  2. Buy a phone number (preferably +55 Brazil)');
    console.log('  3. Set webhook URL to your server');
    process.exit(1);
  }
  
  // Test call (uncomment to actually make a call)
  // const testNumber = process.argv[2];
  // if (testNumber) {
  //   telephony.call(testNumber, { leadName: 'Test' })
  //     .then(result => console.log('Call result:', result))
  //     .catch(err => console.error('Call error:', err));
  // }
  
  console.log('\n✅ Telephony provider ready');
}

module.exports = telephony;
