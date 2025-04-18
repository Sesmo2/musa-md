module.exports = {
    name: '!ping',
    async execute(msg) {
        await msg.reply('Pong! Bot is alive.');
    }
};
