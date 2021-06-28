"use strict";

const {sendMessageToChannel, sendEmbedToChannel, sendLog, deleteMessage} = require("./messages.js");
const {getAvailableId, addInfoData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage, moveHelpMessage} = require("./helpMessages.js");
const {getReadableDate} = require("./date.js");
const {buildDiscussionDetailsEmbeds, buildDiscussionPurgedOrSavedOrMovedMessage, buildDiscussionPurgedOrSavedOrMovedFrenchMessage} = require("./messageBuilder.js");

const helpMessages = {
	"purge": purgeHelpMessage,
	"save": saveHelpMessage,
	"move": moveHelpMessage
};

const purgeCommand = commandMessage => purgeOrSaveCommand(commandMessage, true);

const saveCommand = commandMessage => purgeOrSaveCommand(commandMessage, false);

const purgeOrSaveCommand = (commandMessage, purge) => {
	let commandArguments = commandMessage.content.replace(/^&(purge|save) */i, "").split(" ");
	let purgeOrSave = purge ? "purge" : "save";
	if (commandArguments.length !== 1) {
		sendMessageToChannel(commandMessage.channel,
			`:x: Error : please specify the number of messages to ${purgeOrSave}.\n\n${helpMessages[purgeOrSave]}`);
	} else {
		let messagesId = getMessagesToTreat(commandArguments[0], commandMessage.channel, purgeOrSave);
		if (messagesId) {
			let discussion = buildDiscussion(commandMessage, purgeOrSave, messagesId);
			addInfoData(discussion, "discussions");
			// message in origin channel
			sendMessageToChannel(commandMessage.channel,
				buildDiscussionPurgedOrSavedOrMovedFrenchMessage(discussion.messages.length - 1, purgeOrSave));
			// message in log channel
			sendLog(buildDiscussionPurgedOrSavedOrMovedMessage(discussion.messages.length - 1, purgeOrSave, discussion.id,
				commandMessage.channel.id), commandMessage);
		}
	}
};

const moveCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&move */i, "").split(" ");
	if (commandArguments.length !== 2) {
		sendMessageToChannel(commandMessage.channel,
			":x: Error : please specify the number of messages to move and the destination channel.\n\n" + moveHelpMessage);
	} else {
		let destinationChannelMention = commandArguments[1];
		if (!destinationChannelMention.startsWith("<#") || !destinationChannelMention.endsWith(">")) {
			sendMessageToChannel(commandMessage.channel,
				":x: Error : please mention the channel (exemple : <#330348166799163393>).\n\n" + moveHelpMessage);
		} else {
			let channelId = destinationChannelMention.substring(2, destinationChannelMention.length - 1);
			let destinationChannel = commandMessage.guild.channels.cache.find(channel => {return channel.id === channelId;});
			let messagesId = getMessagesToTreat(commandArguments[0], commandMessage.channel, "move");
			if (messagesId) {
				let discussion = buildDiscussion(commandMessage, "move", messagesId);
				addInfoData(discussion, "discussions");
				// embed in destination channel
				for (let embed of buildDiscussionDetailsEmbeds(discussion, "moved french")) {
					sendEmbedToChannel(destinationChannel, embed);
				}
				// message in origin channel
				sendMessageToChannel(commandMessage.channel,
					buildDiscussionPurgedOrSavedOrMovedFrenchMessage(discussion.messages.length - 1, "move", destinationChannel.id));
				// message in log channel
				sendLog(buildDiscussionPurgedOrSavedOrMovedMessage(discussion.messages.length - 1, "move", discussion.id,
					commandMessage.channel.id, destinationChannel.id), commandMessage);
			}
		}
	}
};

const buildDiscussion = (commandMessage, purgeOrSaveOrMove, messagesId) => {
	let messages = [];
	for (let messageId of messagesId) {
		let message = commandMessage.channel.messages.cache.get(messageId);
		messages.push({
			authorId: message.author.id,
			date: getReadableDate(message.createdAt),
			content: message.content
		});
		if (purgeOrSaveOrMove !== "save") { // delete the message in case of purge or move
			deleteMessage(message);
		}
	}
	return {
		id: getAvailableId("discussions"),
		savingDate: getReadableDate(commandMessage.createdAt),
		action: purgeOrSaveOrMove,
		channelId: commandMessage.channel.id,
		messages: messages
	};
};

const getMessagesToTreat = (commandArgument, channel, purgeOrSaveOrMove) => {
	if (commandArgument.includes("/")) { // look for a date of the form dd/MM (ex: 19/06)
		// todo
	} else if (commandArgument.includes(":")) { // look for a time of the form hh:mm (ex: 23:58)
		// todo
	} else { // look for a number of messages
		let numberOfMessages = parseInt(commandArgument);
		if (isNaN(numberOfMessages)) {
			sendMessageToChannel(channel, `:x: Error : please specify either the number of messages to ${purgeOrSaveOrMove}`
				+ ` or the date from which the messages must be ${purgeOrSaveOrMove}d.\n\n${helpMessages[purgeOrSaveOrMove]}`);
		} else if (numberOfMessages < 1) {
			sendMessageToChannel(channel,
				`:x: Error : the number of messages to ${purgeOrSaveOrMove} must be strictly positive.\n\n${helpMessages[purgeOrSaveOrMove]}`);
		} else {
			return getLastMessagesIdOfChannel(numberOfMessages + 1, channel);
		}
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

const getAllMessagesAfterTimestamp = (timestamp, channel) => {
	let channelMessages = channel.messages.cache.array().filter(message => message.createdAt >= timestamp);
	let result = [];
	for (let message of channelMessages) {
		result.push(message.id);
	}
	return result;
};

module.exports = {saveCommand, purgeCommand, moveCommand};
