"use strict";

const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {purgeHelpMessage} = require("./helpMessages.js");

const purgeCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&purge */i, "").split(" ");
	if (commandArguments.length > 1) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : please specify only the number of messages to delete.\n\n" + purgeHelpMessage);
	} else {
		let numberOfMessagesToDelete = parseInt(commandArguments[0]);
		if (isNaN(numberOfMessagesToDelete)) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : wrong format for the number of messages to delete.\n\n" + purgeHelpMessage);
		} else {
			// todo : do the purge
		}
	}
};

module.exports = {purgeCommand};
