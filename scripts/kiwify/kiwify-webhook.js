/**
 * Kiwify Webhook Server for Laura (Grupo US)
 * Receives events from Kiwify and stores student data
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3456;
const DATA_DIR = '/root/clawd/data/kiwify';
const WEBHOOK_TOKEN = 'laura_grupous_' + crypto.randomBytes(8).toString('hex');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Data files
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// Load existing data
function loadData(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let students = loadData(STUDENTS_FILE);
let events = loadData(EVENTS_FILE);

// Process webhook event
function processEvent(payload) {
  const eventId = payload.order_id || payload.id || Date.now().toString();
  const eventType = payload.webhook_event_type || 'unknown';
  
  // Store event
  if (!events[eventId]) {
    events[eventId] = [];
  }
  events[eventId].push({
    type: eventType,
    timestamp: new Date().toISOString(),
    payload
  });
  saveData(EVENTS_FILE, events);

  // Process student data
  if (payload.Customer) {
    const customer = payload.Customer;
    const email = customer.email?.toLowerCase();
    
    if (email) {
      if (!students[email]) {
        students[email] = {
          name: customer.full_name || customer.name,
          email: email,
          phone: customer.mobile,
          cpf: customer.CPF,
          products: [],
          createdAt: new Date().toISOString()
        };
      }

      // Update student info
      students[email].name = customer.full_name || customer.name || students[email].name;
      students[email].phone = customer.mobile || students[email].phone;
      students[email].lastEventAt = new Date().toISOString();

      // Add product if purchase approved
      if (eventType === 'compra_aprovada' && payload.Product) {
        const productName = payload.Product.product_name;
        if (!students[email].products.includes(productName)) {
          students[email].products.push(productName);
        }
      }

      saveData(STUDENTS_FILE, students);
    }
  }

  console.log(`[${new Date().toISOString()}] Event: ${eventType} - ${payload.Customer?.email || 'unknown'}`);
}

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', students: Object.keys(students).length }));
    return;
  }

  // Get all students
  if (req.method === 'GET' && req.url === '/students') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(students, null, 2));
    return;
  }

  // Search student
  if (req.method === 'GET' && req.url.startsWith('/students/search?')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const query = params.get('q')?.toLowerCase();
    
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter' }));
      return;
    }

    const results = Object.values(students).filter(s =>
      s.email?.toLowerCase().includes(query) ||
      s.name?.toLowerCase().includes(query) ||
      s.phone?.includes(query)
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results, null, 2));
    return;
  }

  // Students by product
  if (req.method === 'GET' && req.url.startsWith('/students/product/')) {
    const productQuery = decodeURIComponent(req.url.split('/product/')[1]).toLowerCase();
    
    const results = Object.values(students).filter(s =>
      s.products?.some(p => p.toLowerCase().includes(productQuery))
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results, null, 2));
    return;
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        processEvent(payload);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error('Webhook error:', e.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kiwify Webhook Server running on port ${PORT}`);
  console.log(`Webhook URL: http://vps.gpus.me:${PORT}/webhook`);
  console.log(`Token: ${WEBHOOK_TOKEN}`);
});

// Export for testing
module.exports = { server, students, events, WEBHOOK_TOKEN };
