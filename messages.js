"use strict";

const Discord = require("discord.js");

const messageIsPoliceBotCommandMessage = message => {
	return message.content.startsWith("&");
};

const sendEmbedToChannel = (channel, embedObject) =>
	sendMessageToChannel(channel, new Discord.MessageEmbed(embedObject));

const sendMessageToChannel = (channel, message, options) =>
	channel.send(message, options)
		.catch(console.error);

const sendPrivateMessage = (user, message) =>
	user.send(message)
		.catch(console.error);

const sendLog = (messageInformation, anyMessage) => {
	let logChannel = anyMessage.client.channels.cache.find(channel => {return channel.id === "795319669459648512"});
	if (messageInformation.title || messageInformation.description) { // embed message
		logChannel.send(new Discord.MessageEmbed(messageInformation))
			.catch(console.log);
	} else { // simple message
		logChannel.send(messageInformation)
			.catch(console.log);
	}
};

const deleteMessage = message => {
	if (message && !message.deleted) {
		message.delete()
			.catch(error => console.log(error));
	}
};

module.exports = {messageIsPoliceBotCommandMessage, sendMessageToChannel, sendPrivateMessage, sendEmbedToChannel, sendLog, deleteMessage};
