"use strict";

const {sendMessageToChannel, sendEmbedToChannel, sendEmbedLog} = require("./messages.js");
const {saveCommand, purgeCommand, moveCommand} = require("./discussions.js");
const {readInfoData, writeInfoData} = require("./dataManipulation.js");
const {removeCommand, detailsCommand} = require("./generalCommands.js");
const {addInfractionCommand, addWarnCommand, addBanCommand, unbanCommand, reloadTempBans} = require("./infractionsWarnsBans.js");
const {handleBadWords, handleBadWordsSoft} = require("./badWords");
const {handleInviteLinks, handleInviteLinksSoft} = require("./inviteLinks.js");
const {buildElementListEmbed, buildNicknameChangeLogEmbed} = require("./messageBuilder.js");
const helpMessages = require("./helpMessages.js");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
	PoliceBot.memberList = readInfoData("members");
	reloadTempBans(PoliceBot);
};

const onMessage = async message => {
	if (message.author.id === "719973594029097040" || !message.member) { // message sent by PoliceBot or by not a member (webhook for example)
		return;
	}
	if (message.channel.type === "dm") { // message is a private message sent to PoliceBot
		await handleBadWordsSoft(message);
		await handleInviteLinksSoft(message);
	} else if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		handlePoliceBotCommand(message);
	} else {
		await handleBadWords(message); // handle bad words for both moderators and non-moderators
		if (!message.member.roles.cache.get("332427771286519808")) { // handle invite links only for non-moderators
			await handleInviteLinks(message);
		}
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

const messageIsPoliceBotCommandMessage = message => {
	return /^&[a-zA-Z]/.test(message.content);
};

const handlePoliceBotCommand = message => {
	let messageContentLowerCase = message.content.toLowerCase();
	if (messageContentLowerCase.startsWith("&help")) { // main &help command
		sendMessageToChannel(message.channel, helpMessages.mainHelpMessage);
	} else if (messageContentLowerCase === "&save") { // help for &save command
		sendMessageToChannel(message.channel, helpMessages.saveHelpMessage);
	} else if (messageContentLowerCase.startsWith("&save ")) { // &save command
		saveCommand(message);
	} else if (messageContentLowerCase === "&purge") { // help for &purge command
		sendMessageToChannel(message.channel, helpMessages.purgeHelpMessage);
	} else if (messageContentLowerCase.startsWith("&purge ")) { // &purge command
		purgeCommand(message);
	} else if (messageContentLowerCase === "&move") { // help for &move command
		sendMessageToChannel(message.channel, helpMessages.moveHelpMessage);
	} else if (messageContentLowerCase.startsWith("&move ")) { // &move command
		moveCommand(message);
	} else if (messageContentLowerCase === "&infractions"
		|| messageContentLowerCase === "&warns"
		|| messageContentLowerCase === "&bans"
		|| messageContentLowerCase === "&discussions") { // display all elements of a type
		for (let embed of buildElementListEmbed(messageContentLowerCase.slice(1))) {
			sendEmbedToChannel(message.channel, embed);
		}
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
};

const onUserUpdate = (oldUser, newUser) => {
	console.log("User has been changed");
	console.log("Old user :");
	console.log(oldUser);
	console.log("New user :");
	console.log(newUser);
};

const onGuildMemberUpdate = (oldMember, newMember) => {
	let oldPseudo = oldMember.nickname ? oldMember.nickname : oldMember.user.username;
	let newPseudo = newMember.nickname ? newMember.nickname : newMember.user.username;
	if (oldPseudo !== newPseudo) {
		sendEmbedLog(buildNicknameChangeLogEmbed(oldPseudo, oldMember.user.tag, newMember.id), newMember.client);
	}
};


module.exports = {onReady, onMessage, onUserUpdate, onGuildMemberUpdate};
