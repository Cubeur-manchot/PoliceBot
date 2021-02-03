"use strict";

const {sendMessageToChannel, sendEmbedToChannel, deleteMessage} = require("./messages.js");
const {getAvailableId, addInfoData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage} = require("./helpMessages.js");
const {getReadableDate} = require("./date.js");
const {buildEmbedElementList} = require("./messageBuilder.js");

const purgeCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&purge */i, "").split(" ");
	if (commandArguments.length > 1) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : please specify only the number of messages to delete.\n\n" + purgeHelpMessage);
	} else {
		let numberOfMessagesToDelete = parseInt(commandArguments[0]);
		if (isNaN(numberOfMessagesToDelete)) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : wrong format for the number of messages to delete.\n\n" + purgeHelpMessage);
		} else if (numberOfMessagesToDelete < 1) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : the number of messages to delete must be strictly positive.\n\n" + purgeHelpMessage);
		} else {
			let messagesIdToDelete = getLastMessagesIdOfChannel(numberOfMessagesToDelete + 1, commandMessage.channel);
			let purgedMessages = [];
			for (let messageId of messagesIdToDelete) {
				let messageToDelete = commandMessage.channel.messages.cache.get(messageId);
				purgedMessages.push({
					authorId: messageToDelete.author.id,
					date: getReadableDate(messageToDelete.createdAt),
					content: messageToDelete.content
				});
				deleteMessage(messageToDelete);
			}
			addInfoData({
				id: getAvailableId("discussions"),
				savingDate: getReadableDate(commandMessage.createdAt),
				purged: true,
				channelId: commandMessage.channel.id,
				messages: purgedMessages
			}, "discussions");
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("discussions"));
		}
	}
};

const saveCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&save */i, "").split(" ");
	if (commandArguments.length > 1) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : please specify only the number of messages to save.\n\n" + saveHelpMessage);
	} else {
		let numberOfMessagesToSave = parseInt(commandArguments[0]);
		if (isNaN(numberOfMessagesToSave)) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : wrong format for the number of messages to save.\n\n" + saveHelpMessage);
		} else if (numberOfMessagesToSave < 1) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : the number of messages to save must be strictly positive.\n\n" + saveHelpMessage);
		} else {
			let messagesIdToSave = getLastMessagesIdOfChannel(numberOfMessagesToSave + 1, commandMessage.channel);
			let savedMessages = [];
			for (let messageId of messagesIdToSave) {
				let messageToSave = commandMessage.channel.messages.cache.get(messageId);
				savedMessages.push({
					authorId: messageToSave.author.id,
					date: getReadableDate(messageToSave.createdAt),
					content: messageToSave.content
				});
			}
			addInfoData({
				id: getAvailableId("discussions"),
				savingDate: getReadableDate(commandMessage.createdAt),
				purged: false,
				channelId: commandMessage.channel.id,
				messages: savedMessages
			}, "discussions");
			deleteMessage(commandMessage);
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("discussions"));
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

module.exports = {saveCommand, purgeCommand};
