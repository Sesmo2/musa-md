const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const path = require('path');

// CLI input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function startBot() {
  const number = await ask('Enter your WhatsApp number (e.g. 23480xxxxxxx): ');
  const ownerJid = number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  rl.close();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['Musa-MD', 'Chrome', '1.0.0']
  });

  // Login logic
  sock.ev.on('connection.update', async (update) => {
    const { connection, isNewLogin } = update;

    if (isNewLogin) {
      try {
        const code = await sock.requestPairingCode(number);
        console.log(`[ Pairing Code ] Enter this on WhatsApp: ${code}`);
      } catch (err) {
        console.error('[!] Failed to get pairing code:', err);
      }
    }

    if (connection === 'open') {
      const sessionId = `SESSION-${Date.now()}`;
      fs.writeFileSync('session_id.txt', sessionId);
      await sock.sendMessage(ownerJid, {
        text: `✅ *Musa-MD is now connected!*\n\nSession ID: *${sessionId}*`
      });
      console.log('[+] Session ID sent to your DM.');
    }

    if (connection === 'close') {
      console.log('[!] Connection closed. Reconnecting...');
      startBot();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Command handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const jid = msg.key.remoteJid;

    if (text === '.ping') {
      await require('./commands/ping')(sock, msg);
    }

    if (text === '.help') {
      await require('./commands/help')(sock, msg);
    }
  });
}

startBot();
