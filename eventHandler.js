"use strict";

const {messageIsPoliceBotCommandMessage, sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {readInfoData, writeInfoData} = require("./dataManipulation.js");
const {addInfractionCommand, addWarnCommand, addBanCommand, detailsCommand, removeCommand, unbanCommand, reloadTempBans} = require("./infractionsWarnsBans.js");
const {handleBadWords} = require("./badWords");
const {buildEmbedElementList} = require("./messageBuilder.js");
const helpMessages = require("./helpMessages.js");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
	PoliceBot.memberList = readInfoData("members");
	reloadTempBans(PoliceBot);
};

const onMessage = message => {
	if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		let messageContentLowerCase = message.content.toLowerCase();
		if (messageContentLowerCase === "&purge") { // help for &purge command
			sendMessageToChannel(message.channel, helpMessages.purgeHelpMessage);
		} else if (messageContentLowerCase === "&infractions" || messageContentLowerCase === "&warns" || messageContentLowerCase === "&bans") { // display all elements of a type
			sendEmbedToChannel(message.channel, buildEmbedElementList(messageContentLowerCase.slice(1)));
		} else if (messageContentLowerCase === "&addinfraction" || messageContentLowerCase === "&infraction") { // help for &addinfraction
			sendMessageToChannel(message.channel, helpMessages.addInfractionHelpMessage);
		} else if (messageContentLowerCase.startsWith("&addinfraction ") || messageContentLowerCase.startsWith("&infraction ")) { // &addinfraction command
			addInfractionCommand(message);
		} else if (messageContentLowerCase === "&addwarn" || messageContentLowerCase === "&warn") { // help for &addwarn
			sendMessageToChannel(message.channel, helpMessages.addWarnHelpMessage);
		} else if (messageContentLowerCase.startsWith("&addwarn ") || messageContentLowerCase.startsWith("&warn ")) { // &addwarn command
			addWarnCommand(message);
		} else if (messageContentLowerCase === "&addban" || messageContentLowerCase === "&ban") { // help for &ban
			sendMessageToChannel(message.channel, helpMessages.addBanHelpMessage);
		} else if (messageContentLowerCase.startsWith("&ban ")) {
			addBanCommand(message);
		} else if (messageContentLowerCase === "&details") { // help for &details
			sendMessageToChannel(message.channel, helpMessages.detailsHelpMessage);
		} else if (messageContentLowerCase.startsWith("&details ")) { // &details command
			detailsCommand(message);
		} else if (messageContentLowerCase === "&remove") { // help for &remove
			sendMessageToChannel(message.channel, helpMessages.removeHelpMessage);
		} else if (messageContentLowerCase.startsWith("&remove ")) { // &remove command
			removeCommand(message);
		} else if (messageContentLowerCase === "&unban") { // help for &unban
			sendMessageToChannel(message.channel, helpMessages.unbanHelpMessage);
		} else if (messageContentLowerCase.startsWith("&unban ")) { // &unban command
			unbanCommand(message);
		} else {
			sendMessageToChannel(message.channel, "Désolé mais pour le moment je ne connais pas cette commande. "
				+ "Si tu trouves que je n'apprends pas assez vite, jette des :tomato: à Cubeur-manchot");
		}
	} else if (message.author.id !== "719973594029097040") { // message not sent by PoliceBot, work on the content
		handleBadWords(message);
	}
	let members = message.client.memberList;
	if (!members[message.author.id] // member is not already registered in the list
		|| ((message.member && message.member.nickname) // if the member has a nickname
			? members[message.author.id] !== message.member.nickname // the nickname doesn't match the registered one
			: members[message.author.id] !== message.author.username)) { // the username doesn't match the registered one
		members[message.author.id] = { // update current username and tag
			username: (message.member && message.member.nickname) ? message.member.nickname : message.author.username,
			tag: message.author.tag
		};
		writeInfoData(members, "members"); // save in data
		message.client.memberList = members; // update cache
	}
};

module.exports = {onReady, onMessage};
