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

const purgeCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "purge");

const saveCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "save");

const moveCommand = commandMessage => purgeOrSaveOrMoveCommand(commandMessage, "move");

const purgeOrSaveOrMoveCommand = async (commandMessage, purgeOrSaveOrMove) => {
	let commandArguments = commandMessage.content.replace(/^&(purge|save|move) */i, "").split(" ").filter(word => word !== "");
	if (commandArguments.length === 0) {
		sendMessageToChannel(commandMessage.channel,
			`:x: Error : please specify the number of messages to ${purgeOrSaveOrMove}.\n\n${helpMessages[purgeOrSaveOrMove]}`);
		return;
	}
	let messagesId = getMessagesToTreat(commandArguments[0], commandMessage.channel, purgeOrSaveOrMove);
	if (!messagesId) {
		return;
	}
	let destinationChannelId;
	if (purgeOrSaveOrMove === "move") {
		let destinationChannelMention = commandArguments[1];
		if (!/<#\d+>/.test(destinationChannelMention)) {
			sendMessageToChannel(commandMessage.channel,
				":x: Error : please mention the destination channel (example : <#330348166799163393>).\n\n" + moveHelpMessage);
			return;
		} else {
			destinationChannelId = destinationChannelMention.substring(2, destinationChannelMention.length - 1);
		}
	}
	let destinationChannel = commandMessage.guild.channels.cache.find(channel => channel.id === destinationChannelId);
	let discussion = buildDiscussion(commandMessage, purgeOrSaveOrMove, messagesId);
	addInfoData(discussion, "discussions");
	if (purgeOrSaveOrMove === "move") {
		// embed in destination channel
		for (let embed of buildDiscussionDetailsEmbeds(discussion, "moved french")) {
			await sendEmbedToChannel(destinationChannel, embed);
		}
	}
	// message in origin channel
	await sendMessageToChannel(commandMessage.channel,
		buildDiscussionPurgedOrSavedOrMovedFrenchMessage(discussion.messages.length - 1, purgeOrSaveOrMove, destinationChannelId));
	// message in log channel
	await sendLog(buildDiscussionPurgedOrSavedOrMovedMessage(discussion.messages.length - 1, purgeOrSaveOrMove, discussion.id,
		commandMessage.channel.id, destinationChannelId), commandMessage);
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
