"use strict";

const {getAvailableId, readInfoData, addInfoData, writeInfoData, removePoliceBotData, groupElementsByMemberId} = require("./dataManipulation.js");
const {getMemberFromId, getMembersFromName, banMember, unbanMember} = require("./members.js");
const {getReadableDate, parseDate, addHours} = require("./date.js");
const {sendMessageToChannel, sendEmbedLog, sendMessageLog} = require("./messages.js");
const {buildMemberInfractionFrenchMessage, buildMemberInfractionMessage,
	buildMemberWarnedFrenchMessage, buildMemberWarnedMessage,
	buildMemberBannedFrenchMessage, buildMemberUnbannedFrenchMessage, buildMemberBanOrUnbanLogEmbed} = require("./messageBuilder.js");
const {addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, unbanHelpMessage} = require("./helpMessages.js");

const addInfractionCommand = async commandMessage => {
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandMessage.content.replace(/^&(add)?infraction */i, ""));
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId and infractionType
	let type = restOfCommand.trim();
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : membre non spécifié ou non reconnu.\n\n" + addInfractionHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : plusieurs membres correspondant.\n\n" + addInfractionHelpMessage);
	} else if (type === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : type non spécifié.\n\n" + addInfractionHelpMessage);
	} else {
		let timezoneOffset = readInfoData("timezoneOffset");
		let infractionId = getAvailableId("infractions");
		let infraction = {
			id: infractionId,
			memberId: memberId,
			date: getReadableDate(addHours(commandMessage.createdAt, timezoneOffset)),
			type: type,
			commentary: commentary
		};
		addInfoData(infraction, "infractions");
		await sendMessageToChannel(commandMessage.channel,
			buildMemberInfractionFrenchMessage(memberId, infractionId, type));
		await sendMessageLog(buildMemberInfractionMessage(memberId, infractionId, type), commandMessage.client);
	}
};

const addWarnCommand = async commandMessage => {
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandMessage.content.replace(/^&(add)?warn */i, ""));
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId
	let reason = restOfCommand.trim();
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : membre non spécifié ou non reconnu.\n\n" + addWarnHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : plusieurs membres correspondant.\n\n" + addWarnHelpMessage);
	} else if (reason === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : raison non spécifiée.\n\n" + addWarnHelpMessage);
	} else {
		let timezoneOffset = readInfoData("timezoneOffset");
		let warnId = getAvailableId("warns");
		let warn = {
			id: warnId,
			memberId: memberId,
			date: getReadableDate(addHours(commandMessage.createdAt, timezoneOffset)),
			reason: reason,
			commentary: commentary
		};
		addInfoData(warn, "warns");
		await sendMessageToChannel(commandMessage.channel,
			buildMemberWarnedFrenchMessage(memberId, warnId, reason));
		await sendMessageLog(buildMemberWarnedMessage(memberId, warnId, reason), commandMessage.client);
	}
};

const addBanCommand = async commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&(add)?ban */i, "");
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandArguments);
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : membre non spécifié ou non reconnu.\n\n" + addBanHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : plusieurs membres correspondant.\n\n" + addBanHelpMessage);
	} else {
		let {reason, expirationDate} = getReasonAndExpirationDate(restOfCommand);
		if (reason === "") {
			sendMessageToChannel(commandMessage.channel, ":x: Erreur : raison du ban non spécifiée.\n\n" + addBanHelpMessage);
		} else {
			let member = await commandMessage.guild.members.fetch(memberId).catch(() => {});
			let timezoneOffset = readInfoData("timezoneOffset");
			let banDate = addHours(commandMessage.createdAt, timezoneOffset);
			if (!member) { // user is not on the server anymore
				if (getActiveBan(memberId, banDate)) {
					sendMessageToChannel(commandMessage.channel, ":x: Erreur : ce membre est déjà banni.");
				} else {
					// todo also ban in this case
					sendMessageToChannel(commandMessage.channel, ":x: Erreur : impossible de bannir ce membre.");
				}
			} else if (!member.bannable) {
				sendMessageToChannel(commandMessage.channel, ":x: Erreur : je n'ai pas l'autorisation de bannir ce membre.");
			} else {
				let banId = getAvailableId("bans");
				let ban = {
					id: banId,
					memberId: memberId,
					date: getReadableDate(banDate),
					expirationDate: expirationDate,
					reason: reason,
					commentary: commentary
				};
				addInfoData(ban, "bans");
				let banStatus = await banMember(memberId, commandMessage.guild.members);
				if (banStatus === "Error") {
					removePoliceBotData([banId]);
					sendMessageToChannel(commandMessage.channel, ":x: Erreur lors du bannissement du membre.");
				} else {
					await sendMessageToChannel(commandMessage.channel,
						buildMemberBannedFrenchMessage(memberId, banId, reason));
					if (expirationDate !== "") { // temporary ban
						setTimeout(() => {
							unbanMember(memberId, commandMessage.guild.members);
						}, parseDate(expirationDate).getTime() - banDate.getTime());
					}
				}
			}
		}
	}
};

const unbanCommand = async commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&unban */i, "");
	let {memberId} = getMemberIdAndRestOfCommand(commandArguments, commandMessage.client.memberList); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : membre non spécifié ou non reconnu.\n\n" + unbanHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : plusieurs membres correspondant.\n\n" + unbanHelpMessage);
	} else {
		let unbanDate = addHours(commandMessage.createdAt, readInfoData("timezoneOffset"));
		let activeBan = getActiveBan(memberId, unbanDate);
		if (activeBan) {
			unbanMember(memberId, commandMessage.guild.members); // unban member
			let bans = readInfoData("bans");
			bans[activeBan.banIndex].expirationDate = getReadableDate(unbanDate); // end the ban
			writeInfoData(bans, "bans"); // save modification
			await sendMessageToChannel(commandMessage.channel,
				buildMemberUnbannedFrenchMessage(memberId, activeBan.ban.id));
		} else {
			sendMessageToChannel(commandMessage.channel, ":x: Erreur : le membre n'est pas banni.\n\n");
		}
	}
};

const getCommentaryAndRestOfCommand = argumentsString => {
	let [beginCommand, ...commentary] = argumentsString.split("//");
	return {
		beginCommand: beginCommand.trim(),
		commentary: commentary.join(" ").trim()
	};
};

const getMemberIdAndRestOfCommand = (argumentsString, memberList) => {
	let listOfWords = argumentsString.split(" ").filter(word => word !== "");
	if (listOfWords.length === 0) { // no argument
		return {
			memberId: undefined,
			restOfCommand: ""
		}
	} else {
		if (/^<@!([0-9]{18})>$/.test(listOfWords[0])) { // user mention : <@! + 18 digits + >
			return {
				memberId: getMemberFromId(listOfWords[0].substr(3, 18), memberList),
				restOfCommand: listOfWords.slice(1).join(" ")
			}
		} else if (/^([0-9]{18})$/.test(listOfWords[0])) { // user id : 18 digits
			return {
				memberId: getMemberFromId(listOfWords[0], memberList),
				restOfCommand: listOfWords.slice(1).join(" ")
			}
		} else { // look for the name
			let firstPart = "";
			let secondPart = listOfWords;
			while (secondPart.length !== 0) {
				firstPart += (firstPart === "" ? "" : " ") + secondPart.shift();
				let foundMembers = getMembersFromName(firstPart, memberList);
				if (foundMembers.length === 1) { // unique match
					return {
						memberId: foundMembers[0],
						restOfCommand: listOfWords.join(" ")
					}
				} else if (foundMembers.length > 1) { // many matches
					return {
						memberId: "many",
						restOfCommand: listOfWords.join(" ")
					}
				} // else no match, ignore
			}
			return { // no member has been found
				memberId: undefined,
				restOfCommand: listOfWords.join(" ")
			}
		}
	}
};

const getReasonAndExpirationDate = argumentsString => {
	let reasonArray = [], expirationDate = "";
	for (let word of argumentsString.split(" ").filter(word => word !== "")) {
		if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(word)) { // word matches a date
			expirationDate = (getReadableDate(parseDate(word)) + "").substring(0, 10); // clean date before saving it
		} else { // normal word
			reasonArray.push(word);
		}
	}
	return {
		reason: reasonArray.join(" "),
		expirationDate: expirationDate
	}
};

const handleBanAdd = user => {
	let correspondingBan = getActiveBan(user.id, addHours(new Date(), readInfoData("timezoneOffset")));
	sendEmbedLog(buildMemberBanOrUnbanLogEmbed(user.id, correspondingBan ? correspondingBan.ban.id : undefined, user.avatarURL(), "ban"), user.client);
};

const handleBanRemove = user => {
	let correspondingBan = getLastFinishedBan(user.id, addHours(new Date(), readInfoData("timezoneOffset")));
	sendEmbedLog(buildMemberBanOrUnbanLogEmbed(user.id, correspondingBan ? correspondingBan.id : undefined, user.avatarURL(), "unban"), user.client);
};

const getActiveBan = (userId, date) => {
	let bans = readInfoData("bans");
	let correspondingBanIndex = bans.findIndex(ban => {
		return ban.memberId === userId && (ban.expirationDate === "" || parseDate(ban.expirationDate) > date);
	});
	if (correspondingBanIndex === -1) {
		return undefined;
	} else {
		return {
			banIndex: correspondingBanIndex,
			ban: bans[correspondingBanIndex]
		}
	}
};

const getLastFinishedBan = (userId, date) => {
	let matchingBans = readInfoData("bans").filter(ban => ban.expirationDate !== "" && parseDate(ban.expirationDate) < date);
	if (matchingBans.length) {
		return matchingBans.sort((firstBan, secondBan) => parseDate(secondBan.expirationDate) - parseDate(firstBan.expirationDate))[0];
	} else {
		return undefined;
	}
};

const reloadTempBans = PoliceBot => {
	let cubeursFrancophonesServer = PoliceBot.guilds.cache.get("329175643877015553");
	let bansGroupedByMemberId = groupElementsByMemberId(readInfoData("bans"));
	let bansExpirationDate = [];
	for (let memberId in bansGroupedByMemberId) {
		let bansOfThisMember = bansGroupedByMemberId[memberId];
		for (let ban of bansOfThisMember) {
			let expirationDate = parseDate(ban.expirationDate);
			if (expirationDate === "") { // member is definitively banned
				bansExpirationDate[memberId] = undefined;
				break;
			} else if (expirationDate > bansExpirationDate[memberId] || bansExpirationDate[memberId] === undefined) { // found later expiration date, update the saved one
				bansExpirationDate[memberId] = expirationDate;
			}
		}
	}
	let relaunchedTempBansCount = 0;
	let timezoneOffset = readInfoData("timezoneOffset");
	let currentDate = addHours(new Date(), timezoneOffset);
	for (let memberId in bansExpirationDate) {
		let expirationDate = bansExpirationDate[memberId];
		if (expirationDate) { // check if date is not undefined
			if (expirationDate > currentDate) { // expiration date is in the future, the unban must be planed from now
				setTimeout(() => {
					unbanMember(memberId, cubeursFrancophonesServer.members);
				}, expirationDate.getTime() - currentDate.getTime());
				relaunchedTempBansCount ++;
			} else { // expiration date is in the past, member must be unbanned
				unbanMember(memberId, cubeursFrancophonesServer.members, true);
			}
		}
	}
	if (relaunchedTempBansCount) {
		console.log(`PoliceBot has relaunched ${relaunchedTempBansCount} temporary ban${relaunchedTempBansCount === 1 ? "" : "s"}`);
	}
};

module.exports = {addInfractionCommand, addWarnCommand, addBanCommand, unbanCommand, handleBanAdd, handleBanRemove, reloadTempBans};
