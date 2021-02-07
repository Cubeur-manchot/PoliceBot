"use strict";

const {sendMessageToChannel, sendLog, deleteMessage} = require("./messages.js");
const {getAvailableId, addInfoData} = require("./dataManipulation.js");
const {saveHelpMessage, purgeHelpMessage, moveHelpMessage} = require("./helpMessages.js");
const {getReadableDate} = require("./date.js");
const {buildEmbedsDiscussionDetails} = require("./messageBuilder.js");

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
				purged: purge,
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
const moveCommand = commandMessage => {
};
			let discussion = {
				id: getAvailableId("discussions"),
				savingDate: getReadableDate(commandMessage.createdAt),
				purged: purge,
				channelId: commandMessage.channel.id,
				messages: messages
			};
			addInfoData(discussion, "discussions");
			if (!purge) {
				deleteMessage(commandMessage);
			}
			for (let embed of buildEmbedsDiscussionDetails(discussion)) {
				sendLog(embed, commandMessage);
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
