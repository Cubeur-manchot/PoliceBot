"use strict";

const {sendMessageToChannel, sendEmbedToChannel, deleteMessage} = require("./messages.js");
const {getAvailableId, addInfoData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage} = require("./helpMessages.js");
const {getReadableDate} = require("./date.js");
const {buildEmbedElementList} = require("./messageBuilder.js");

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
			let messages = [];
			for (let messageId of messagesId) {
				let message = commandMessage.channel.messages.cache.get(messageId);
				messages.push({
					authorId: message.author.id,
					date: getReadableDate(message.createdAt),
					content: message.content
				});
				if (purge) {
					deleteMessage(message);
				}
			}
			addInfoData({
				id: getAvailableId("discussions"),
				savingDate: getReadableDate(commandMessage.createdAt),
				purged: true,
				channelId: commandMessage.channel.id,
				messages: messages
			}, "discussions");
			if (!purge) {
				deleteMessage(commandMessage);
			}
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
