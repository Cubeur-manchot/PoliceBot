"use strict";

const {messageContainsBadWord, whichBadWordIsContained, messageIsPoliceBotCommandMessage, sendMessageToChannel} = require("./messageHandler.js");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
};

const onMessage = message => {
	if (messageIsPoliceBotCommandMessage(message)) { // message is a PoliceBot command
		sendMessageToChannel(message.channel, "Un message pour moi ?");
	} else if (messageContainsBadWord(message)) { // message containing at least one bad word
		let moderatorRole = message.guild.roles.cache.array().find(role => {return role.name === "Moderateur";});
		sendMessageToChannel(message.channel, `Oh c'est pas bien de dire ça ! <@&${moderatorRole.id}> :eyes:`);
	} // else normal message, don't care
};

module.exports = {onReady, onMessage};
