"use strict";

const {getAvailableId, readInfoData, addInfoData, writeInfoData, removePoliceBotData, groupElementsByMemberId} = require("./dataManipulation.js");
const {getMemberFromId, getMembersFromName, banMember, unbanMember} = require("./members.js");
const {getReadableDate, parseDate, addHours} = require("./date.js");
const {sendMessageToChannel, sendEmbedLog, sendMessageLog} = require("./messages.js");
const {buildMemberInfractionOrWarnedMessage,
	buildMemberBannedFrenchMessage, buildMemberUnbannedFrenchMessage, buildMemberBanOrUnbanLogEmbed} = require("./messageBuilder.js");
const {addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, unbanHelpMessage} = require("./helpMessages.js");

const helpMessages = {
	"infraction": addInfractionHelpMessage,
	"warn": addWarnHelpMessage,
	"ban": addBanHelpMessage,
	"unban": unbanHelpMessage
};

const addInfractionOrWarnCommand = async (commandMessage, infoType) => {
	let {parseCheck, memberId, commentary, restOfCommand} = parseAndCheckMemberIdAndCommentary(commandMessage, infoType);
	if (parseCheck) {
		if (restOfCommand === "") {
			sendMessageToChannel(commandMessage.channel, `:x: Erreur : ${infoType === "infraction" ? "type" : "motif"} non spécifié.\n\n` + helpMessages[infoType]);
		} else {
			let timezoneOffset = readInfoData("timezoneOffset");
			let id = getAvailableId(infoType + "s");
			let infractionOrWarn = {
				id: id,
				memberId: memberId,
				date: getReadableDate(addHours(commandMessage.createdAt, timezoneOffset)),
				commentary: commentary
			};
			infractionOrWarn[infoType === "infraction" ? "type" : "reason"] = restOfCommand;
			addInfoData(infractionOrWarn, infoType + "s");
			await sendMessageToChannel(commandMessage.channel, buildMemberInfractionOrWarnedMessage("french", infoType, memberId, id, restOfCommand));
			await sendMessageLog(buildMemberInfractionOrWarnedMessage("english", infoType, memberId, id, restOfCommand), commandMessage.client);
		}
	}
};

const addInfractionCommand = async commandMessage => {
	await addInfractionOrWarnCommand(commandMessage, "infraction");
};

const addWarnCommand = async commandMessage => {
	await addInfractionOrWarnCommand(commandMessage, "warn");
};

const addBanCommand = async commandMessage => {
	let {parseCheck, memberId, commentary, restOfCommand} = parseAndCheckMemberIdAndCommentary(commandMessage, "ban");
	if (parseCheck) {
		let {reason, expirationDate} = getReasonAndExpirationDate(restOfCommand);
		if (reason === "") {
			sendMessageToChannel(commandMessage.channel, ":x: Erreur : motif non spécifié.\n\n" + addBanHelpMessage);
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

let parseAndCheckMemberIdAndCommentary = (commandMessage, infoType) => {
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandMessage.content.replace(new RegExp(`^&(add)?${infoType} *`,"i"), ""));
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList);
	let parseCheck = false;
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : membre non spécifié ou non reconnu.\n\n" + helpMessages[infoType]);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Erreur : plusieurs membres correspondant.\n\n" + helpMessages[infoType]);
	} else {
		parseCheck = true;
	}
	return {parseCheck, memberId, commentary, restOfCommand};
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
