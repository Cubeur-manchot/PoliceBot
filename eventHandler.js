"use strict";

const {sendMessageToChannel, sendEmbedToChannel, sendEmbedSoftLog} = require("./messages.js");
const {saveCommand, purgeCommand, moveCommand} = require("./discussions.js");
const {readInfoData, writeInfoData, setupGoogleSheetsAPICredentials, loadData} = require("./dataManipulation.js");
const {removeCommand, detailsCommand} = require("./generalCommands.js");
const {addInfractionCommand, addWarnCommand, addBanCommand, unbanCommand, handleBanAdd, handleBanRemove, reloadTempBans} = require("./infractionsWarnsBans.js");
const {handleBadWords, handleBadWordsSoft} = require("./badWords");
const {handleInviteLinks, handleInviteLinksSoft} = require("./inviteLinks.js");
const {buildElementListEmbed, buildNicknameChangeLogEmbed, buildAvatarChangeLogEmbed,
	buildMessageChangeLogEmbeds, buildMessageDeleteLogEmbed} = require("./messageBuilder.js");
const helpMessages = require("./helpMessages.js");

const onReady = PoliceBot => {
	PoliceBot.user.setActivity("lire les messages du serveur")
		.then(() => console.log("PoliceBot is ready !"))
		.catch(console.error);
	PoliceBot.memberList = readInfoData("members");
	reloadTempBans(PoliceBot);
	setupGoogleSheetsAPICredentials();
};

const onMessage = async message => {
	if (message.author.id === "719973594029097040") { // message sent by PoliceBot
		return;
	} else if (message.channel.type === "dm") { // message is a private message sent to PoliceBot
		await handleBadWordsSoft(message);
		await handleInviteLinksSoft(message);
	} else if (!message.member) { // message sent by not a member (webhook for example)
		return;
	} else if (messageIsPoliceBotCommandMessage(message) // message is a PoliceBot command
		&& message.member.roles.cache.get("332427771286519808")) { // message is sent by a moderator
		await handlePoliceBotCommand(message);
	} else {
		await handleBadWords(message); // handle bad words for both moderators and non-moderators
		if (!message.member.roles.cache.get("332427771286519808") // handle invite links only for non-moderators
			&& !message.member.roles.cache.get("329903067283718147")) { // and non-founder
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

const onMessageUpdate = async (oldMessage, newMessage) => {
	if (!newMessage.author.bot) {
		let oldMessageContent = oldMessage.content.replace(/\*/g,"\*");
		let newMessageContent = newMessage.content.replace(/\*/g,"\*");
		if (newMessageContent !== oldMessageContent) {
			let embeds = buildMessageChangeLogEmbeds(oldMessageContent, newMessageContent, newMessage.author.id,
				newMessage.url, newMessage.channel.id, newMessage.author.avatarURL());
			for (let embed of embeds) {
				sendEmbedSoftLog(embed, newMessage.client);
			}
		}
	}
	await onMessage(newMessage);
};

const onMessageDelete = message => {
	let attachmentsUrlByType = {images : [], others: []};
	for (let attachment of message.attachments.array()) {
		attachmentsUrlByType[/\.(png|jpe?g|gif)$/.test(attachment.url) ? "images" : "others"].push(attachment.url);
	}
	if (attachmentsUrlByType.images.length === 1) { // one image, include it inside the embed
		sendEmbedSoftLog(buildMessageDeleteLogEmbed(message.content, message.author.id, message.channel.id, message.author.avatarURL(),
			attachmentsUrlByType.images[0]), message.client);
	} else if (attachmentsUrlByType.images.length === 0 && attachmentsUrlByType.others.length === 0) { // no attachment
		sendEmbedSoftLog(buildMessageDeleteLogEmbed(message.content, message.author.id, message.channel.id, message.author.avatarURL(),
			undefined), message.client);
	} else { // many or non-image attachments, attach them to the embed message
		sendEmbedSoftLog(buildMessageDeleteLogEmbed(message.content, message.author.id, message.channel.id, message.author.avatarURL(),
			undefined), message.client, [...attachmentsUrlByType.images, ...attachmentsUrlByType.others]);
	}

};

const messageIsPoliceBotCommandMessage = message => {
	return /^&[a-zA-Z]/.test(message.content);
};

const handlePoliceBotCommand = async message => {
	if (message.content === "&test") {
		let data = await loadData("test");
		console.log("data :");
		console.log(data);
		return;
	}
	let messageContentLowerCase = message.content.toLowerCase();
	if (messageContentLowerCase.startsWith("&help")) { // main &help command
		sendMessageToChannel(message.channel, helpMessages.mainHelpMessage);
	} else if (messageContentLowerCase === "&save") { // help for &save command
		sendMessageToChannel(message.channel, helpMessages.saveHelpMessage);
	} else if (messageContentLowerCase.startsWith("&save ")) { // &save command
		await saveCommand(message);
	} else if (messageContentLowerCase === "&purge") { // help for &purge command
		sendMessageToChannel(message.channel, helpMessages.purgeHelpMessage);
	} else if (messageContentLowerCase.startsWith("&purge ")) { // &purge command
		await purgeCommand(message);
	} else if (messageContentLowerCase === "&move") { // help for &move command
		sendMessageToChannel(message.channel, helpMessages.moveHelpMessage);
	} else if (messageContentLowerCase.startsWith("&move ")) { // &move command
		await moveCommand(message);
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
		await addInfractionCommand(message);
	} else if (messageContentLowerCase === "&addwarn" || messageContentLowerCase === "&warn") { // help for &addwarn
		sendMessageToChannel(message.channel, helpMessages.addWarnHelpMessage);
	} else if (messageContentLowerCase.startsWith("&addwarn ") || messageContentLowerCase.startsWith("&warn ")) { // &addwarn command
		await addWarnCommand(message);
	} else if (messageContentLowerCase === "&addban" || messageContentLowerCase === "&ban") { // help for &ban
		sendMessageToChannel(message.channel, helpMessages.addBanHelpMessage);
	} else if (messageContentLowerCase.startsWith("&ban ")) {
		await addBanCommand(message);
	} else if (messageContentLowerCase === "&details") { // help for &details
		sendMessageToChannel(message.channel, helpMessages.detailsHelpMessage);
	} else if (messageContentLowerCase.startsWith("&details ")) { // &details command
		detailsCommand(message);
	} else if (messageContentLowerCase === "&remove") { // help for &remove
		sendMessageToChannel(message.channel, helpMessages.removeHelpMessage);
	} else if (messageContentLowerCase.startsWith("&remove ")) { // &remove command
		await removeCommand(message);
	} else if (messageContentLowerCase === "&unban") { // help for &unban
		sendMessageToChannel(message.channel, helpMessages.unbanHelpMessage);
	} else if (messageContentLowerCase.startsWith("&unban ")) { // &unban command
		await unbanCommand(message);
	} else {
		sendMessageToChannel(message.channel, "Désolé mais pour le moment je ne connais pas cette commande. "
			+ "Si tu trouves que je n'apprends pas assez vite, jette des :tomato: à <@!217709941081767937>");
	}
};

const onUserUpdate = (oldUser, newUser) => {
	let oldAvatarUrl = oldUser.avatarURL();
	let newAvatarUrl = newUser.avatarURL();
	if (newAvatarUrl !== oldAvatarUrl) {
		sendEmbedSoftLog(buildAvatarChangeLogEmbed(newUser.id, oldAvatarUrl, newAvatarUrl), newUser.client);
	}
	let oldUsername = oldUser.username;
	let newUsername = newUser.username;
	if (oldUsername !== newUsername) {
		let member = newUser.client.guilds.cache.get("329175643877015553").members.cache.get(newUser.id);
		if (member && !member.nickname) { // visible pseudo in the server changes if and only if it is not overwritten by the member nickname
			sendEmbedSoftLog(buildNicknameChangeLogEmbed(oldUsername, oldUser.tag, newUser.id, newUser.avatarURL(), "Username"), newUser.client);
		}
	}
};

const onGuildMemberUpdate = (oldMember, newMember) => {
	let oldPseudo = oldMember.nickname ? oldMember.nickname : oldMember.user.username;
	let newPseudo = newMember.nickname ? newMember.nickname : newMember.user.username;
	if (oldPseudo !== newPseudo) {
		sendEmbedSoftLog(buildNicknameChangeLogEmbed(oldPseudo, oldMember.user.tag, newMember.id, newMember.user.avatarURL(), "Nickname"), newMember.client);
	}
};

const onGuildBanAdd = user => {
	handleBanAdd(user);
};

const onGuildBanRemove = user => {
	handleBanRemove(user);
};

module.exports = {onReady, onMessage, onMessageUpdate, onMessageDelete, onUserUpdate, onGuildMemberUpdate, onGuildBanAdd, onGuildBanRemove};
