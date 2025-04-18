const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = {};

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[command.name] = command;
}

// Init WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Show QR code in terminal
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Confirm bot is ready
client.on('ready', async () => {
    console.log('Bot is ready!');
    setInterval(() => {
        client.sendPresenceAvailable(); // Always-online trick
    }, 20 * 1000); // every 20 seconds
});

// Message event
client.on('message', async msg => {
    const text = msg.body.toLowerCase();
    if (commands[text]) {
        await commands[text].execute(msg);
    }
});

// Auto view status every 10 seconds
client.on('ready', async () => {
    setInterval(async () => {
        try {
            const statuses = await client.getStatus();
            // status viewing logic here (if available in newer versions of whatsapp-web.js)
        } catch (err) {
            console.error("Status check failed:", err);
        }
    }, 10000);
});

client.initialize();






















