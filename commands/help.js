module.exports = async (sock, msg) => {
  await sock.sendMessage(msg.key.remoteJid, {
    text: '*Musa-MD Commands:*\n\n.ping - Test the bot\n.help - Show command list'
  });
};
