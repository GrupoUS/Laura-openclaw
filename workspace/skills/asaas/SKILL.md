# Asaas Skill

Integrate with Asaas API to retrieve customer and payment information.

## Configuration
- API Key stored in: `/Users/mauricio/.openclaw/config/asaas.json`
- Base URL: `https://api.asaas.com/v3`

## Scripts
### `asaas_client.js`
Usage:
```bash
node skills/asaas/scripts/asaas_client.js search_customer <email_or_cpf>
node skills/asaas/scripts/asaas_client.js get_payments <customer_id>
node skills/asaas/scripts/asaas_client.js check_student <email_or_cpf>
```

## MCP Server
Official MCP URL: `https://docs.asaas.com/mcp`
(Requires Access Token injection - Not yet configured in mcporter due to remote nature)

## Dependencies
- Node.js (Built-in fetch)
