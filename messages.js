"use strict";

const Discord = require("discord.js");

const sendMessageToChannel = (channel, message, options) =>
	channel.send(message, options)
		.catch(console.error);

const sendEmbedToChannel = (channel, embedObject, attachments) =>
	sendMessageToChannel(channel, {embed: new Discord.MessageEmbed(embedObject), files: attachments},);

const sendPrivateMessage = (user, message) =>
	user.send(message)
		.catch(console.error);

const sendMessageLog = (message, client) => {
	sendMessageToChannel(client.channels.cache.find(channel => {return channel.id === "795319669459648512"}), message);
};

const sendEmbedLog = (embed, client) => {
	sendEmbedToChannel(client.channels.cache.find(channel => {return channel.id === "795319669459648512"}), embed);
};

const sendMessageSoftLog = (message, client) => {
	sendMessageToChannel(client.channels.cache.find(channel => {return channel.id === "861357829357043752"}), message);
};

const sendEmbedSoftLog = (embed, client, attachments) => {
	sendEmbedToChannel(client.channels.cache.find(channel => {return channel.id === "861357829357043752"}), embed, attachments);
};

const deleteMessage = message => {
	if (message && !message.deleted) {
		message.delete()
			.catch(error => console.log(error));
	}
};

module.exports = {sendMessageToChannel, sendPrivateMessage, sendEmbedToChannel,
	sendMessageLog, sendEmbedLog, sendMessageSoftLog, sendEmbedSoftLog,
	deleteMessage};
