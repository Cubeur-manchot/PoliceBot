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
		sendMessageToChannel(message.channel, "Oh c'est pas bien de dire ça ! :eyes:");
	} // else normal message, don't care
};

const onMessageUpdate = (oldMessage, newMessage) => {
	onMessage(newMessage);
};

const onMessageDelete = message => {

};

module.exports = {onReady, onMessage, onMessageUpdate, onMessageDelete};
