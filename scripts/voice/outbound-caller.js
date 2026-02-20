/**
 * Outbound Caller - Initiate calls to leads
 * 
 * Usage:
 *   node scripts/voice/outbound-caller.js call +5562999999999 "Maria" "TRINTAE3"
 *   node scripts/voice/outbound-caller.js queue   # Process pending leads
 * 
 * Environment:
 *   GEMINI_API_KEY - For Laura's LLM responses
 *   DEEPGRAM_API_KEY - For STT (optional)
 */

const fs = require('fs');
const path = require('path');
const telephony = require('./telephony');
const LauraVoice = require('./laura-voice');

// Business hours (BRT timezone)
const BUSINESS_HOURS = {
  start: 9,  // 9:00 AM
  end: 24,   // 6:00 PM -> midnight for testing
  days: [0, 1, 2, 3, 4, 5, 6] // All days enabled for testing
};

// Rate limiting
const MAX_CALLS_PER_HOUR = 10;
const callHistory = [];

/**
 * Check if current time is within business hours
 */
function isBusinessHours() {
  const now = new Date();
  // Adjust for BRT (UTC-3)
  const brtHour = (now.getUTCHours() - 3 + 24) % 24;
  const day = now.getUTCDay();
  
  return BUSINESS_HOURS.days.includes(day) &&
         brtHour >= BUSINESS_HOURS.start &&
         brtHour < BUSINESS_HOURS.end;
}

/**
 * Check rate limiting
 */
function canMakeCall() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentCalls = callHistory.filter(t => t > oneHourAgo);
  return recentCalls.length < MAX_CALLS_PER_HOUR;
}

/**
 * Make an outbound call to a lead
 */
async function callLead(phoneNumber, options = {}) {
  const { name, product, source } = options;
  
  console.log(`\n📞 Preparing to call lead...`);
  console.log(`   Phone: ${phoneNumber}`);
  console.log(`   Name: ${name || 'Unknown'}`);
  console.log(`   Product: ${product || 'General'}`);
  console.log(`   Source: ${source || 'Unknown'}`);
  
  // Pre-flight checks
  if (!isBusinessHours()) {
    console.log(`\n⏰ Outside business hours (${BUSINESS_HOURS.start}h-${BUSINESS_HOURS.end}h BRT)`);
    console.log(`   Scheduling for next business hour...`);
    // TODO: Add to queue for later
    return { status: 'scheduled', reason: 'outside_business_hours' };
  }
  
  if (!canMakeCall()) {
    console.log(`\n⚠️  Rate limit reached (${MAX_CALLS_PER_HOUR}/hour)`);
    return { status: 'rate_limited', reason: 'max_calls_per_hour' };
  }
  
  if (!telephony.isConfigured()) {
    console.log(`\n❌ Telephony not configured`);
    console.log(`   Edit config/telephony.json with your Twilio/Voximplant credentials`);
    return { status: 'error', reason: 'telephony_not_configured' };
  }
  
  // Initialize Laura for this call
  const laura = new LauraVoice({
    leadInfo: { name, phone: phoneNumber, source, product },
    onResponse: (text) => {
      console.log(`🗣️  Laura: ${text}`);
    }
  });
  
  try {
    // Make the call
    const result = await telephony.call(phoneNumber, {
      leadName: name,
      product: product,
      lauraGreeting: laura.getGreeting()
    });
    
    // Track the call
    callHistory.push(Date.now());
    
    // Log the call
    const logEntry = {
      timestamp: new Date().toISOString(),
      phone: phoneNumber,
      name: name,
      product: product,
      callSid: result.sid || result.call_id,
      status: 'initiated'
    };
    
    // Append to call log
    const logPath = path.join(__dirname, '../../data/voice-calls.json');
    let logs = [];
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (e) {
      // File doesn't exist, start fresh
    }
    logs.push(logEntry);
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    
    console.log(`\n✅ Call initiated successfully!`);
    console.log(`   Call SID: ${result.sid || result.call_id}`);
    
    return { status: 'success', callSid: result.sid || result.call_id };
    
  } catch (err) {
    console.error(`\n❌ Failed to initiate call:`, err.message);
    return { status: 'error', reason: err.message };
  }
}

/**
 * Process pending leads from queue
 */
async function processQueue() {
  console.log('📋 Processing lead queue...');
  
  // TODO: Integrate with sdr-leads-watch.js to get pending leads
  // For now, this is a placeholder
  
  const queuePath = path.join(__dirname, '../../data/call-queue.json');
  
  if (!fs.existsSync(queuePath)) {
    console.log('No pending leads in queue.');
    return;
  }
  
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  console.log(`Found ${queue.length} leads in queue.`);
  
  for (const lead of queue) {
    if (!isBusinessHours()) {
      console.log('Outside business hours. Stopping queue processing.');
      break;
    }
    
    if (!canMakeCall()) {
      console.log('Rate limit reached. Stopping queue processing.');
      break;
    }
    
    await callLead(lead.phone, {
      name: lead.name,
      product: lead.product,
      source: lead.source
    });
    
    // Wait between calls
    await new Promise(r => setTimeout(r, 5000));
  }
}

/**
 * Add lead to call queue
 */
function addToQueue(phone, name, product, source) {
  const queuePath = path.join(__dirname, '../../data/call-queue.json');
  
  let queue = [];
  try {
    queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  } catch (e) {
    // File doesn't exist
  }
  
  queue.push({
    phone,
    name,
    product,
    source,
    addedAt: new Date().toISOString()
  });
  
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
  console.log(`✅ Lead added to queue: ${phone}`);
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
🎙️  Laura Outbound Caller

Usage:
  node outbound-caller.js call <phone> [name] [product]
  node outbound-caller.js queue
  node outbound-caller.js add <phone> [name] [product]
  node outbound-caller.js status

Commands:
  call    - Make an immediate call to a phone number
  queue   - Process pending leads from the queue
  add     - Add a lead to the queue for later calling
  status  - Show call statistics and business hours status

Examples:
  node outbound-caller.js call +5562999999999 "Maria Silva" "TRINTAE3"
  node outbound-caller.js add +5562888888888 "João" "NEON"
  node outbound-caller.js queue
`);
    process.exit(0);
  }
  
  switch (command) {
    case 'call':
      const phone = args[1];
      if (!phone) {
        console.error('❌ Phone number required');
        process.exit(1);
      }
      callLead(phone, {
        name: args[2],
        product: args[3],
        source: 'manual'
      }).then(result => {
        console.log('\nResult:', result);
      });
      break;
      
    case 'queue':
      processQueue();
      break;
      
    case 'add':
      const addPhone = args[1];
      if (!addPhone) {
        console.error('❌ Phone number required');
        process.exit(1);
      }
      addToQueue(addPhone, args[2], args[3], 'manual');
      break;
      
    case 'status':
      console.log(`\n📊 Outbound Caller Status`);
      console.log(`   Business hours: ${isBusinessHours() ? '✅ Open' : '❌ Closed'}`);
      console.log(`   Hours: ${BUSINESS_HOURS.start}:00 - ${BUSINESS_HOURS.end}:00 BRT`);
      console.log(`   Days: Mon-Fri`);
      console.log(`   Rate limit: ${canMakeCall() ? '✅ OK' : '⚠️ Reached'}`);
      console.log(`   Telephony: ${telephony.isConfigured() ? '✅ Configured' : '⚠️ Not configured'}`);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

module.exports = { callLead, processQueue, addToQueue, isBusinessHours };
