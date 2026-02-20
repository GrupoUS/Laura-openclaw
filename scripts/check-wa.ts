import { getWhatsAppRuntime } from '/opt/homebrew/lib/node_modules/openclaw/extensions/whatsapp/src/runtime.js';
console.log(Object.keys(getWhatsAppRuntime().channel.whatsapp));