"use strict";

const {sendMessageToChannel, sendEmbedToChannel, sendMessageLog, deleteMessage} = require("./messages.js");
const {getAvailableId, appendData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage, moveHelpMessage} = require("./helpMessages.js");
const {getReadableDate, convertDateUtcToLocal, getLastTimeStampFromHoursAndMinutes, getLastTimeStampFromMonthAndDay} = require("./date.js");
const {buildDiscussionDetailsEmbeds, buildDiscussionPurgedOrSavedOrMovedMessage, buildDiscussionPurgedOrSavedOrMovedFrenchMessage} = require("./messageBuilder.js");

const helpMessages = {
	"purge": purgeHelpMessage,
	"save": saveHelpMessage,
	"move": moveHelpMessage
};

const translateToFrenchWithoutSuffix = {
	"purge": "supprim",
	"save": "sauvegard",
	"move": "déplac"
};

const purgeCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "purge");

const saveCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "save");

const moveCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "move");

const purgeOrSaveOrMoveCommand = async (commandMessage, purgeOrSaveOrMove) => {
	let commandArguments = commandMessage.content.replace(/^&(purge|save|move) */i, "").split(" ").filter(word => word !== "");
	let messagesId = getMessagesToTreat(commandArguments[0], commandMessage.channel, purgeOrSaveOrMove);
	if (!messagesId) {
		return;
	}
	let destinationChannelId;
	if (purgeOrSaveOrMove === "move") {
		let destinationChannelMention = commandArguments[1];
		if (!/<#\d+>/.test(destinationChannelMention)) {
			sendMessageToChannel(commandMessage.channel,
				":x: Erreur : veuillez mentionner le salon de destination (exemple : <#330348166799163393>).\n\n" + moveHelpMessage);
			return;
		} else {
			destinationChannelId = destinationChannelMention.substring(2, destinationChannelMention.length - 1);
		}
	}
	let destinationChannel = commandMessage.guild.channels.cache.find(channel => channel.id === destinationChannelId);
	let discussion = await buildDiscussion(commandMessage, purgeOrSaveOrMove, messagesId);
	await appendData(discussion, "discussions");
	if (purgeOrSaveOrMove === "move") {
		// embed in destination channel
		for (let embed of buildDiscussionDetailsEmbeds(discussion, "moved french")) {
			await sendEmbedToChannel(destinationChannel, embed);
		}
	}
	// message in origin channel
	await sendMessageToChannel(commandMessage.channel,
		buildDiscussionPurgedOrSavedOrMovedFrenchMessage(discussion.messages.length - 1, purgeOrSaveOrMove, destinationChannelId, discussion.id));
	// message in log channel
	await sendMessageLog(buildDiscussionPurgedOrSavedOrMovedMessage(discussion.messages.length - 1, purgeOrSaveOrMove, discussion.id,
		commandMessage.channel.id, destinationChannelId), commandMessage.client);
};

const buildDiscussion = async (commandMessage, purgeOrSaveOrMove, messagesId) => {
	let messages = [];
	for (let messageId of messagesId) {
		let message = commandMessage.channel.messages.cache.get(messageId);
		messages.push({
			authorId: message.author.id,
			date: getReadableDate(convertDateUtcToLocal(message.createdAt)),
			content: message.content
		});
		if (purgeOrSaveOrMove !== "save") { // delete the message in case of purge or move
			deleteMessage(message);
		}
	}
	return {
		id: await getAvailableId("discussions"),
		savingDate: getReadableDate(convertDateUtcToLocal(commandMessage.createdAt)),
		action: purgeOrSaveOrMove,
		channelId: commandMessage.channel.id,
		messages: messages
	};
};

const getMessagesToTreat = (commandArgument, channel, purgeOrSaveOrMove) => {
	if (/^\d+$/.test(commandArgument)) { // argument is a number of messages
		let numberOfMessages = parseInt(commandArgument);
		if (numberOfMessages === 0) {
			sendMessageToChannel(channel,
				`:x: Erreur : le nombre de messages à ${translateToFrenchWithoutSuffix[purgeOrSaveOrMove]}er doit être strictement positif.\n\n`
					+ helpMessages[purgeOrSaveOrMove]);
		} else {
			return getLastMessagesIdOfChannel(numberOfMessages + 1, channel);
		}
	} else if (commandArgument.includes("/")) { // look for a date of the form dd/MM
		if (!/^\d\d\/\d\d$/.test(commandArgument)) {
			sendMessageToChannel(channel, ":x: Erreur : veuillez spécifier la date au format jj/MM (exemple: 19/06).\n\n"
				+ helpMessages[purgeOrSaveOrMove]);
		} else {
			let timeStamp = getLastTimeStampFromMonthAndDay(commandArgument);
			return getAllMessagesIdAfterTimestamp(timeStamp, channel);
		}
	} else if (commandArgument.includes(":")) { // look for a time of the form hh:mm
		if (!/^\d\d:\d\d$/.test(commandArgument)) {
			sendMessageToChannel(channel, ":x: Erreur : veuillez spécifier l'heure au format hh:mm (exemple: 23:58).\n\n"
				+ helpMessages[purgeOrSaveOrMove]);
		} else {
			let timeStamp = getLastTimeStampFromHoursAndMinutes(commandArgument);
			return getAllMessagesIdAfterTimestamp(timeStamp, channel);
		}
	} else { // look for a number of messages
		sendMessageToChannel(channel,
			`:x: Erreur : veuillez spécifier le nombre de messages à ${translateToFrenchWithoutSuffix[purgeOrSaveOrMove]}er,`
			+ ` ou la date ou l'heure à partir de laquelle les messages doivent être ${translateToFrenchWithoutSuffix[purgeOrSaveOrMove]}és.\n\n`
			+ helpMessages[purgeOrSaveOrMove]);
	}
	return undefined; // stands for all error cases
};

const getLastMessagesIdOfChannel = (nbMessages, channel) => {
	let channelMessages = channel.messages.cache.array();
	let newestMessages = [{index: 0, id: channelMessages[0].id}];
	for (let channelMessagesIndex = 1; channelMessagesIndex < channelMessages.length; channelMessagesIndex++) {
		let messageToInsert = channelMessages[channelMessagesIndex];
		if (!messageToInsert.deleted) {
			let firstNewerElementIndex = newestMessages.findIndex(newestMessage =>
				channelMessages[newestMessage.index].createdAt > messageToInsert.createdAt
			);
			if (firstNewerElementIndex === -1) {
				firstNewerElementIndex = newestMessages.length;
			}
			newestMessages.splice(firstNewerElementIndex, 0, {index: channelMessagesIndex, id: messageToInsert.id});
			if (newestMessages.length > nbMessages) {
				newestMessages.shift();
			}
		}
	}
	let result = [];
	for (let message of newestMessages) {
		result.push(message.id);
	}
	return result;
};

const getAllMessagesIdAfterTimestamp = (timestamp, channel) => {
	let channelMessages = channel.messages.cache.array().filter(message => message.createdAt >= timestamp);
	let result = [];
	for (let message of channelMessages) {
		result.push(message.id);
	}
	return result;
};

module.exports = {saveCommand, purgeCommand, moveCommand};
