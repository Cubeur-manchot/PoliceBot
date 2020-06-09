"use strict";

const {badWords, badWordsRegex} = require("./badWords.js");

const messageContainsBadWord = message => {
	return message.content.match(badWordsRegex);
};

const whichBadWordIsContained = message => {
	return badWords.find(badWord => {
		return message.content.match(badWord);
	});
};

const messageIsPoliceBotCommandMessage = message => {
	return message.content.startsWith("&");
};

const sendMessageToChannel = (channel, message, options) => {
	channel.send(message, options)
		.catch(console.error);
};

module.exports = {messageContainsBadWord, whichBadWordIsContained, messageIsPoliceBotCommandMessage, sendMessageToChannel};
