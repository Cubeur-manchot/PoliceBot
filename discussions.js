"use strict";

const {sendMessageToChannel, sendEmbedToChannel, sendLog, deleteMessage} = require("./messages.js");
const {getAvailableId, addInfoData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage, moveHelpMessage} = require("./helpMessages.js");
const {getReadableDate} = require("./date.js");
const {buildDiscussionDetailsEmbeds,
	buildDiscussionMovedMessage, buildDiscussionMovedFrenchMessage,
	buildDiscussionPurgedOrSavedMessage, buildDiscussionPurgedOrSavedFrenchMessage} = require("./messageBuilder.js");

const purgeCommand = commandMessage => purgeOrSaveCommand(commandMessage, true);

const saveCommand = commandMessage => purgeOrSaveCommand(commandMessage, false);

const purgeOrSaveCommand = (commandMessage, purge) => {
	let commandArguments = commandMessage.content.replace(/^&(purge|save) */i, "").split(" ");
	let helpMessage = purge ? purgeHelpMessage : saveHelpMessage;
	let purgeOrSave = purge ? "purge" : "save";
	if (commandArguments.length > 1) {
		sendMessageToChannel(commandMessage.channel,
			`:x: Error : please specify only the number of messages to ${purgeOrSave}.\n\n${helpMessage}`);
	} else {
		let numberOfMessages = parseInt(commandArguments[0]);
		if (isNaN(numberOfMessages)) {
			sendMessageToChannel(commandMessage.channel,
				`:x: Error : wrong format for the number of messages to ${purgeOrSave}.\n\n${helpMessage}`);
		} else if (numberOfMessages < 1) {
			sendMessageToChannel(commandMessage.channel,
				`:x: Error : the number of messages to ${purgeOrSave} must be strictly positive.\n\n${helpMessage}`);
		} else {
			let messagesId = getLastMessagesIdOfChannel(numberOfMessages + 1, commandMessage.channel);
			let discussion = {
				id: getAvailableId("discussions"),
				savingDate: getReadableDate(commandMessage.createdAt),
				action: purge ? "purge" : "save",
				channelId: commandMessage.channel.id,
				messages: []
			};
			for (let messageId of messagesId) {
				let message = commandMessage.channel.messages.cache.get(messageId);
				discussion.messages.push({
					authorId: message.author.id,
					date: getReadableDate(message.createdAt),
					content: message.content
				});
				if (purge) {
					deleteMessage(message);
				}
			}
			addInfoData(discussion, "discussions");
			// embed in origin channel
			let embedInfoOrigin = buildDiscussionPurgedOrSavedFrenchMessage(discussion.messages.length - 1, purge);
			sendMessageToChannel(commandMessage.channel, embedInfoOrigin);
			// embed in log channel
			let embedLog = buildDiscussionPurgedOrSavedMessage(discussion.messages.length - 1, commandMessage.channel.id, discussion.id, purge);
			sendLog(embedLog, commandMessage);
		}
	}
};

const moveCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&move */i, "").split(" ");
	if (commandArguments.length !== 2) {
		sendMessageToChannel(commandMessage.channel,
			":x: Error : please specify the number of messages to move and the destination channel.\n\n" + moveHelpMessage);
	} else {
		let numberOfMessages = parseInt(commandArguments[0]);
		let destinationChannelMention = commandArguments[1];
		if (!destinationChannelMention.startsWith("<#") || !destinationChannelMention.endsWith(">")) {
			sendMessageToChannel(commandMessage.channel,
				":x: Error : please mention the channel (exemple : <#330348166799163393>).\n\n" + moveHelpMessage);
		} else {
			let channelId = destinationChannelMention.substring(2, destinationChannelMention.length - 1);
			let destinationChannel = commandMessage.guild.channels.cache.find(channel => {return channel.id === channelId;});
			if (isNaN(numberOfMessages)) {
				sendMessageToChannel(commandMessage.channel,
					":x: Error : wrong format for the number of messages to move.\n\n" + moveHelpMessage);
			} else if (numberOfMessages < 1) {
				sendMessageToChannel(commandMessage.channel,
					":x: Error : the number of messages to move must be strictly positive.\n\n" + moveHelpMessage);
			} else {
				let messagesId = getLastMessagesIdOfChannel(numberOfMessages + 1, commandMessage.channel);
				let discussion = {
					id: getAvailableId("discussions"),
					savingDate: getReadableDate(commandMessage.createdAt),
					action: "move",
					channelId: commandMessage.channel.id,
					messages: []
				};
				for (let messageId of messagesId) {
					let message = commandMessage.channel.messages.cache.get(messageId);
					discussion.messages.push({
						authorId: message.author.id,
						date: getReadableDate(message.createdAt),
						content: message.content
					});
					deleteMessage(message);
				}
				addInfoData(discussion, "discussions");
				// embed in destination channel
				for (let embed of buildDiscussionDetailsEmbeds(discussion, "moved french")) {
					sendEmbedToChannel(destinationChannel, embed);
				}
				// embed in origin channel
				let embedInfoOrigin = buildDiscussionMovedFrenchMessage(discussion.messages.length - 1, destinationChannel.id);
				sendMessageToChannel(commandMessage.channel, embedInfoOrigin);
				// embed in log channel
				let embedLog = buildDiscussionMovedMessage(discussion.messages.length - 1, commandMessage.channel.id, destinationChannel.id, discussion.id);
				sendLog(embedLog, commandMessage);
			}
		}
	}
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

module.exports = {saveCommand, purgeCommand, moveCommand};
