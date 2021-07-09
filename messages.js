"use strict";

const Discord = require("discord.js");

const sendMessageToChannel = (channel, message, options) =>
	channel.send(message, options)
		.catch(console.error);

const sendEmbedToChannel = (channel, embedObject) =>
	sendMessageToChannel(channel, new Discord.MessageEmbed(embedObject));

const sendPrivateMessage = (user, message) =>
	user.send(message)
		.catch(console.error);

const sendMessageLog = (message, client) => {
	sendMessageToChannel(client.channels.cache.find(channel => {return channel.id === "795319669459648512"}), message);
};

const sendEmbedLog = (embed, client) => {
	sendEmbedToChannel(client.channels.cache.find(channel => {return channel.id === "795319669459648512"}), embed);
};

const deleteMessage = message => {
	if (message && !message.deleted) {
		message.delete()
			.catch(error => console.log(error));
	}
};

module.exports = {messageIsPoliceBotCommandMessage,
	sendMessageToChannel, sendPrivateMessage, sendEmbedToChannel,
	sendMessageLog, sendEmbedLog,
	deleteMessage};
