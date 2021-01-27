"use strict";

const {sendMessageToChannel, sendEmbedToChannel, deleteMessage} = require("./messages.js");
const {purgeHelpMessage} = require("./helpMessages.js");

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
			for (let messageId of messagesIdToDelete) {
				let messageToDelete = commandMessage.channel.messages.cache.get(messageId);
				deleteMessage(messageToDelete);
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

module.exports = {purgeCommand};
