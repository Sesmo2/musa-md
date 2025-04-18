const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, PHONENUMBER_MCC } = require('@whiskeysockets/baileys');
const readline = require('readline');
const fs = require('fs');
const pino = require('pino');
const NodeCache = require('node-cache');
const qrcode = require('qrcode-terminal');

// Utility for CLI input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for owner number
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Main function
async function startBot() {
  const ownerInput = await ask('Enter your WhatsApp number (e.g. 23480xxxxxx): ');
  const OWNER_JID = ownerInput.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  rl.close();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();
  const msgRetryCache = new NodeCache();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().info)
    },
    printQRInTerminal: true,
    msgRetryCache,
    logger: pino({ level: 'silent' })
  });

  // Pairing code support
  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect, pairingCode } = update;

    if (connection === 'connecting') {
      console.log('[!] Connecting...');
    }

    if (connection === 'open') {
      const sessionId = `SESSION-${Date.now()}`;
      fs.writeFileSync('session_id.txt', sessionId);
      console.log('[+] Connected successfully!');
      console.log(`[+] Session ID: ${sessionId}`);
      await sock.sendMessage(OWNER_JID, { text: `✅ *New WhatsApp Bot Session Created!*\n\nSession ID: *${sessionId}*` });
    }

    if (qr) {
      console.log('[QR] Scan the code above with WhatsApp.');
    }

    if (pairingCode) {
      console.log(`[PAIRING CODE] Use this code to link: ${pairingCode}`);
    }

    if (connection === 'close') {
      console.log('[!] Connection closed. Reconnecting...');
      startBot();
    }
  });

  // Handle new credentials
  sock.ev.on('creds.update', saveCreds);

  // Basic command handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (text === '.ping') {
      await sock.sendMessage(jid, { text: 'Pong!' });
    } else if (text === '.help') {
      await sock.sendMessage(jid, {
        text: '*Available Commands:*\n\n.ping - Check bot status\n.help - Show this menu'
      });
    }
  });
}

startBot();
