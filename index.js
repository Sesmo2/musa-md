const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const messageHandler = require('./handlers/messageHandler');
const statusViewer = require('./status/statusViewer');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
    statusViewer(client); // Auto-view status
});

client.on('message', msg => {
    messageHandler(client, msg);
});

client.initialize();






















