"use strict";

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
};

const onMessage = message => {

};

const onMessageUpdate = (oldMessage, newMessage) => {
	onMessage(message);
};

const onMessageDelete = message => {

};

module.exports = {onReady, onMessage, onMessageUpdate, onMessageDelete};
