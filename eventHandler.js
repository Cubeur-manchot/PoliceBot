"use strict";

const {containedBadWords, messageIsPoliceBotCommandMessage, sendMessageToChannel, buildBadWordsLogEmbed, sendLog, deleteMessage} = require("./messageHandler.js");
const {readInfoData, writeInfoData} = require("./dataManipulation.js");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
};

const onMessage = async message => {
	if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		sendMessageToChannel(message.channel, "Désolé mais pour le moment je ne supporte aucune commande. "
			+ "Si tu trouves que je n'apprends pas assez vite, jette des :tomato: à Cubeur-manchot");
	} else if (message.author.id !== "719973594029097040") { // message not sent by PoliceBot, work on the content
		let badWords = containedBadWords(message);
		if (badWords !== null) {
			deleteMessage(message);
			let warningMessage = await sendMessageToChannel(message.channel, "Oh c'est pas bien de dire ça ! :eyes:");
			sendLog(buildBadWordsLogEmbed(message, badWords, warningMessage), warningMessage);
		}
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
