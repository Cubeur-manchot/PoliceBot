"use strict";

const {badWordsRegex} = require("./badWords.js");
const Discord = require("discord.js");

const containedBadWords = message => {
	return message.content.match(badWordsRegex);
};

const messageIsPoliceBotCommandMessage = message => {
	return message.content.startsWith("&");
};

const sendMessageToChannel = (channel, message, options) =>
	channel.send(message, options)
		.catch(console.error);

const buildBadWordsLogEmbed = (message, badWords) => {
	return {
		color: "#0099ff",
		title: "__Bad words__",
		description: `User <@!${message.author.id}> sent bad word(s) in <#${message.channel.id}>`,
		fields: [{
			name: "Original message",
			value: message.content
		},{
			name: "Bad word(s) :",
			value: "- " + badWords.join("\n- ")
		}],
		timestamp: new Date()
	};
};

const sendLog = (messageInformation, warningMessage) => {
	let logChannel = warningMessage.client.channels.cache.find(channel => {return channel.id === "795319669459648512"});
	if (messageInformation.title) { // embed message
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

module.exports = {containedBadWords, messageIsPoliceBotCommandMessage, sendMessageToChannel, buildBadWordsLogEmbed, sendLog, deleteMessage};
