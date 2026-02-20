const fs = require('fs');
const path = require('path');

const CONFIG_PATH = '/Users/mauricio/openclaw/config/asaas.json';

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function request(endpoint, params = {}) {
  const config = loadConfig();
  const url = new URL(`${config.base_url}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'access_token': config.api_key,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Asaas API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function listCustomers(identifier) {
  const params = {};
  if (identifier.includes('@')) {
    params.email = identifier;
  } else {
    params.cpfCnpj = identifier.replace(/\D/g, '');
  }
  return request('/customers', params);
}

async function listPayments(customerId) {
  return request('/payments', { customer: customerId, limit: 20 });
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg1 = args[1];

  if (!cmd) {
    console.log("Usage: node asaas_client.js <search_customer|get_payments|check_student> <arg>");
    return;
  }

  try {
    if (cmd === 'search_customer') {
      console.log(JSON.stringify(await listCustomers(arg1), null, 2));
    } else if (cmd === 'get_payments') {
      console.log(JSON.stringify(await listPayments(arg1), null, 2));
    } else if (cmd === 'check_student') {
      const customers = await listCustomers(arg1);
      if (!customers.data || customers.data.length === 0) {
        console.log(JSON.stringify({ error: "Customer not found" }, null, 2));
        return;
      }
      const customer = customers.data[0];
      const payments = await listPayments(customer.id);
      
      console.log(JSON.stringify({
        customer: {
            name: customer.name,
            id: customer.id,
            email: customer.email,
            cpfCnpj: customer.cpfCnpj
        },
        payments: payments.data || []
      }, null, 2));
    }
  } catch (e) {
    console.error(e.message);
  }
}

main();
