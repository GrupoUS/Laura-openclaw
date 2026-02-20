import os
import json
import sys
import requests

CONFIG_PATH = '/Users/mauricio/openclaw/config/asaas.json'

def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def get_headers(api_key):
    return {
        'access_token': api_key,
        'Content-Type': 'application/json'
    }

def list_customers(email=None, cpf=None):
    config = load_config()
    url = f"{config['base_url']}/customers"
    params = {}
    if email: params['email'] = email
    if cpf: params['cpfCnpj'] = cpf
    
    response = requests.get(url, headers=get_headers(config['api_key']), params=params)
    return response.json()

def list_payments(customer_id=None):
    config = load_config()
    url = f"{config['base_url']}/payments"
    params = {'limit': 20}
    if customer_id: params['customer'] = customer_id
    
    response = requests.get(url, headers=get_headers(config['api_key']), params=params)
    return response.json()

def main():
    if len(sys.argv) < 2:
        print("Usage: python asaas_client.py <command> [args]")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == 'search_customer':
        email = sys.argv[2] if '@' in sys.argv[2] else None
        cpf = sys.argv[2] if '@' not in sys.argv[2] else None
        print(json.dumps(list_customers(email, cpf), indent=2))
        
    elif cmd == 'get_payments':
        customer_id = sys.argv[2]
        print(json.dumps(list_payments(customer_id), indent=2))
        
    elif cmd == 'check_student':
        # Search by email/cpf and get payments
        identifier = sys.argv[2]
        email = identifier if '@' in identifier else None
        cpf = identifier if '@' not in identifier else None
        
        customers = list_customers(email, cpf)
        if not customers.get('data'):
            print(json.dumps({"error": "Customer not found"}, indent=2))
            return
            
        customer = customers['data'][0]
        payments = list_payments(customer['id'])
        
        result = {
            "customer": {
                "name": customer['name'],
                "id": customer['id'],
                "email": customer['email'],
                "cpfCnpj": customer['cpfCnpj']
            },
            "payments": payments.get('data', [])
        }
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
