module.exports = {
    name: '!menu',
    async execute(msg) {
        await msg.reply('*Command Menu:*\n\n!ping - test bot\n!menu - show commands');
    }
};
