"use strict";

const {messageIsPoliceBotCommandMessage, sendMessageToChannel, sendEmbedToChannel} = require("./messageHandler.js");
const {readInfoData, removeHelpMessage, removeData} = require("./dataManipulation.js");
const {infractionHelpMessage, buildEmbedInfractionsList, addInfractionCommand} = require("./infractions.js");
const {handleBadWords} = require("./badWords");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
};

const onMessage = message => {
	if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		let messageContentLowerCase = message.content.toLowerCase();
		if (messageContentLowerCase === "&infractions") {
			sendEmbedToChannel(message.channel, buildEmbedInfractionsList(readInfoData("infractions")));
		} else if (messageContentLowerCase.startsWith("&addinfraction")) {
			if (messageContentLowerCase === "&addinfraction") { // without arguments, send help message
				sendMessageToChannel(message.channel, infractionHelpMessage);
			} else { // with arguments, add an infraction
				addInfractionCommand(message);
			}
		} else if (messageContentLowerCase.startsWith("&remove")) {
			if (messageContentLowerCase === "&remove") { // without arguments, send help message
				sendMessageToChannel(message.channel, removeHelpMessage);
			} else { // with arguments, remove an object (infraction, warn, ban)
				removeDataAndHandleResults(messageContentLowerCase.replace(/^&remove */, ""), message);
			}
		} else {
			sendMessageToChannel(message.channel, "Désolé mais pour me moment je ne connais pas cette commande. "
				+ "Si tu trouves que je n'apprends pas assez vite, jette des :tomato: à Cubeur-manchot");
		}
	} else if (message.author.id !== "719973594029097040") { // message not sent by PoliceBot, work on the content
		handleBadWords(message);
	}
};

const removeDataAndHandleResults = (argumentsString, message) => {
	let {infractionsWereRemoved, warnsWereRemoved, bandWereRemoved, failed} = removeData(argumentsString, message);
	if (infractionsWereRemoved) {
		sendEmbedToChannel(message.channel, buildEmbedInfractionsList(readInfoData("infractions")));
	}
	if (warnsWereRemoved) {
		// todo when embed is built
	}
	if (bandWereRemoved) {
		// todo when embed is built
	}
	if (failed.length) {
		sendMessageToChannel(message.channel, ":x: Failed to remove :\n- " + failed.join("\n- "));
	}
};

module.exports = {onReady, onMessage};
