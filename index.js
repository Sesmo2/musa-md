const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: 'remote',
    const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Load commands from /commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
  : [];

const commands = {};
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands[command.name] = command;
}

// WhatsApp Client Setup with Pairing Code Support
const client = new Client({
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  },
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  takeoverOnConflict: true,
});

// Show pairing code in terminal
client.on('pairing-code', (code) => {
  console.log('\n=== WHATSAPP PAIRING CODE ===\n');
  console.log('Pairing Code:', code);
  console.log('\n1. Open WhatsApp > Linked Devices');
  console.log('2. Tap "Link a device" > Use pairing code');
  console.log('3. Enter the code above\n');
});

// Ready event
client.on('ready', () => {
  console.log('✅ Bot is connected and ready.');

  // Keep online presence
  setInterval(() => {
    client.sendPresenceAvailable();
  }, 20 * 1000);
});

// Listen for messages
client.on('message', async (msg) => {
  const text = msg.body.toLowerCase();
  if (commands[text]) {
    await commands[text].execute(msg);
  }
});

// Placeholder for auto status view
client.on('ready', async () => {
  console.log('Auto status check running every 15s (placeholder)');
  setInterval(async () => {
    try {
      // Replace with actual status check logic when API supports it
      console.log('[Status Check] Simulating status view...');
    } catch (err) {
      console.error('Error checking status:', err);
    }
  }, 15000);
});

client.initialize();
}
