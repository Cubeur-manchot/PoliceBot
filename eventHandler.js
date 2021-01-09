"use strict";

const {messageIsPoliceBotCommandMessage, sendMessageToChannel, sendEmbedToChannel, buildEmbedInfractionsList} = require("./messageHandler.js");
const {readInfoData, writeInfoData} = require("./dataManipulation.js");
const {handleBadWords} = require("./badWords");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
};

const onMessage = message => {
	if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		if (message.content === "&infractions") {
			sendEmbedToChannel(message.channel, buildEmbedInfractionsList(readInfoData("infractions")));
		} else {
			sendMessageToChannel(message.channel, "Désolé mais pour me moment je ne connais pas cette commande. "
				+ "Si tu trouves que je n'apprends pas assez vite, jette des :tomato: à Cubeur-manchot");
		}
	} else if (message.author.id !== "719973594029097040") { // message not sent by PoliceBot, work on the content
		handleBadWords(message);
		if (message.content === "coucou") {
			let currentInfractions = readInfoData("infractions");
			let newInfraction = {
				name: "new infraction",
				type: "test"
			};
			writeInfoData(newInfraction, "infractions");
		}
	}
};

module.exports = {onReady, onMessage};
