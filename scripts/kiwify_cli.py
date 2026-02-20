#!/usr/bin/env python3
"""
Kiwify CLI API Client for OpenClaw
Replaces legacy Node.js kiwify.js, kiwify-api.js scripts.

Usage:
  ./kiwify_cli.py products
  ./kiwify_cli.py sales [days]
  ./kiwify_cli.py search "email@or.phone"
  ./kiwify_cli.py stats [start_date] [end_date]
"""

import sys
import json
import os
import time
import requests
from urllib.parse import urlencode
from datetime import datetime, timedelta

CONFIG_PATH = os.path.expanduser('~/.openclaw/config/kiwify.json')
TOKEN_PATH = os.path.expanduser('~/.openclaw/config/kiwify-token.json')

class KiwifyClient:
    def __init__(self):
        try:
            with open(CONFIG_PATH, 'r') as f:
                self.config = json.load(f)
        except Exception as e:
            print(f"Erro ao carregar config {CONFIG_PATH}: {e}")
            sys.exit(1)

        self.client_id = self.config.get('client_id')
        self.client_secret = self.config.get('client_secret')
        self.account_id = self.config.get('account_id')
        self.base_url = self.config.get('base_url', 'https://builderapi.kiwify.com.br')
        self.token = None
        self.token_expiry = 0

    def get_token(self):
        # Memory check
        if self.token and time.time() < self.token_expiry:
            return self.token

        # File cache check
        try:
            if os.path.exists(TOKEN_PATH):
                with open(TOKEN_PATH, 'r') as f:
                    cached = json.load(f)

                # Python stores timestamp, check if expired (96h limit)
                created_at = cached.get('created_at', 0)
                if isinstance(created_at, int) and created_at > 1000000000000:
                    created_at = created_at / 1000.0 # JS ms to Python s

                if time.time() - created_at < 340000: # ~94 hours
                    access_token = cached.get('access_token') or cached.get('token')
                    if access_token:
                        self.token = access_token
                        self.token_expiry = created_at + 340000
                        return self.token
        except Exception:
            pass

        # Request new token
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }

        try:
            resp = requests.post(f"{self.base_url}/v1/oauth/token", data=data, headers=headers)
            resp.raise_for_status()
            result = resp.json()

            self.token = result.get('access_token')
            expires_in = result.get('expires_in', 3600)
            self.token_expiry = time.time() + expires_in - 60

            # Save cache
            with open(TOKEN_PATH, 'w') as f:
                json.dump({
                    'access_token': self.token,
                    'created_at': int(time.time() * 1000)
                }, f, indent=2)

            return self.token
        except Exception as e:
            print(f"Erro ao obter token OAuth: {e}")
            if 'resp' in locals() and hasattr(resp, 'text'):
                print(resp.text)
            sys.exit(1)

    def request(self, endpoint, params=None):
        if params is None:
            params = {}

        token = self.get_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'x-kiwify-account-id': self.account_id
        }

        url = f"{self.base_url}/v1{endpoint}"
        if params:
            url += '?' + urlencode(params)

        try:
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"API Error {endpoint}: {e}")
            if 'resp' in locals() and hasattr(resp, 'text'):
                print(resp.text)
            return {"data": []}

    def list_products(self, page=1, page_size=20):
        # Depending on the api version it's /products or /v1/products - wrapper already adds /v1
        res = self.request('/products', {'page_number': page, 'page_size': page_size})
        print("=== PRODUTOS KIWIFY ===")
        for p in res.get('data', []):
            print(f"🥝 {p.get('name')} ({p.get('id')})")
        return res

    def list_sales(self, days=30):
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        res = self.request('/sales', {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'page_size': 100
        })

        print(f"=== VENDAS (últimos {days} dias) ===")
        for s in res.get('data', []):
            cust = s.get('customer', {})
            prod = s.get('product', {})
            print(f"💰 {cust.get('email', 'N/A')} - {prod.get('name', 'N/A')} - {s.get('status')}")
        return res

    def search_customer(self, query):
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365*2) # 2 years back

        res = self.request('/sales', {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'page_size': 100
        })

        # fallback if API supports /customers directly
        customer_res = self.request('/customers', {'search': query})

        query_norm = "".join(filter(str.isdigit, query)) if any(c.isdigit() for c in query) else query.lower()

        print(f"=== BUSCA: {query} ===")
        found = []

        # Try finding in sales history
        for s in res.get('data', []):
            cust = s.get('customer', {})
            email = (cust.get('email') or '').lower()
            phone = cust.get('mobile') or cust.get('phone') or ''
            phone_norm = "".join(filter(str.isdigit, phone))

            if (query.lower() in email) or (query_norm and query_norm in phone_norm):
                found.append(s)

        for s in found:
            cust = s.get('customer', {})
            prod = s.get('product', {})
            print(f"👤 {cust.get('name')} | {cust.get('email')} | {cust.get('mobile')}")
            print(f"   ↳ 📦 {prod.get('name')} - Status: {s.get('status')} - Data: {s.get('created_at', '')[:10]}")

        if not found and customer_res.get('data'):
            for c in customer_res.get('data', []):
                print(f"👤 {c.get('name')} - {c.get('email')} - {c.get('phone')}")

        if not found and not customer_res.get('data'):
            print("Nenhum registro encontrado.")

        return found

def main():
    if len(sys.argv) < 2:
        print("Uso: ./kiwify_cli.py [products|sales|search]")
        print("Exemplos:")
        print("  ./kiwify_cli.py products")
        print("  ./kiwify_cli.py sales 30")
        print("  ./kiwify_cli.py search 'email@example.com'")
        sys.exit(1)

    cmd = sys.argv[1]
    client = KiwifyClient()

    if cmd == 'products':
        client.list_products()
    elif cmd == 'sales':
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        client.list_sales(days)
    elif cmd == 'search':
        if len(sys.argv) < 3:
            print("Forneça o email ou telefone para busca.")
            sys.exit(1)
        client.search_customer(" ".join(sys.argv[2:]))
    elif cmd == 'token':
        print(client.get_token())
    else:
        print(f"Comando desconhecido: {cmd}")
        sys.exit(1)

if __name__ == '__main__':
    main()
