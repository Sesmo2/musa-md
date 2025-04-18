const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');

// Load and save auth state
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveState);

    // Respond to "!ping"
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0];
            if (!msg.key.fromMe && msg.message?.conversation === '!ping') {
                await sock.sendMessage(msg.key.remoteJid, { text: 'Pong!' });
            }
        }
    });

    // Listen for presence updates (status-related events)
    sock.ev.on('presence.update', (presence) => {
        console.log('Presence update:', presence);
    });

    sock.ev.on('chats.update', (chat) => {
        console.log('Chat updated:', chat);
    });

    sock.ev.on('contacts.update', (update) => {
        console.log('Contact updated:', update);
    });

    // Fetch status updates (experimental)
    async function fetchStatuses() {
        const statusJid = 'status@broadcast'; // Statuses group
        const statusList = await sock.chatRead(statusJid);
        console.log('Fetched status list:', statusList);
    }

    // Call this once at start
    fetchStatuses();

    // Keep bot alive (auto reconnect)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot is online and connected!');
        }
    });
}

startBot();
