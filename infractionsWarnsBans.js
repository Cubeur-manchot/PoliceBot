"use strict";

const {getAvailableId, readPoliceBotData, removePoliceBotData, readInfoData, addInfoData, writeInfoData, groupElementsByMemberId, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {getMemberFromId, getMembersFromName, banMember, unbanMember} = require("./members.js");
const {getReadableDate, parseDate} = require("./date.js");
const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {buildEmbedElementList, buildEmbedElementDetails} = require("./messageBuilder.js");
const {addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, detailsHelpMessage, unbanHelpMessage} = require("./helpMessages.js");

const addInfractionCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&addinfraction */i, "");
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandArguments);
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId and infractionType
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + addInfractionHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + addInfractionHelpMessage);
	} else if (restOfCommand === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified infraction type.\n\n" + addInfractionHelpMessage);
	} else {
		addInfoData({
			id: getAvailableId("infractions"),
			memberId: memberId,
			date: getReadableDate(commandMessage.createdAt),
			type: restOfCommand,
			commentary: commentary
		}, "infractions");
		sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("infractions"));
	}
};

const addWarnCommand = commandMessage => {
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandMessage.content.replace(/^&(add)?warn */i, ""));
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + addWarnHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + addWarnHelpMessage);
	} else {
		let {reason, linkedInfractions, notLinkedInfractions} = getReasonAndLinkedInfractions(restOfCommand);
		if (notLinkedInfractions.length) {
			sendMessageToChannel(commandMessage.channel, `:x: Error : failed to link infraction(s) : ${notLinkedInfractions.join(", ")}.`);
		} else if (reason === "") {
			sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified warn reason.\n\n" + addWarnHelpMessage);
		} else {
			addInfoData({
				id: getAvailableId("warns"),
				memberId: memberId,
				date: getReadableDate(commandMessage.createdAt),
				reason: reason,
				infractions: linkedInfractions,
				commentary: commentary
			}, "warns");
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("warns"));
		}
	}
};

const addBanCommand = async commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&(add)?ban */i, "");
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandArguments);
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.client.memberList); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + addBanHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + addBanHelpMessage);
	} else {
		let {reason, linkedWarns, notLinkedWarns, expirationDate} = getReasonLinkedWarnsAndExpirationDate(restOfCommand);
		if (notLinkedWarns.length) {
			sendMessageToChannel(commandMessage.channel, `:x: Error : failed to link warn(s) : ${notLinkedWarns.join(", ")}.`);
		} else if (reason === "") {
			sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified ban reason.\n\n" + addBanHelpMessage);
		} else {
			addInfoData({
				id: getAvailableId("bans"),
				memberId: memberId,
				date: getReadableDate(commandMessage.createdAt),
				expirationDate: expirationDate,
				reason: reason,
				warns: linkedWarns,
				commentary: commentary
			}, "bans");
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("bans"));
			let banStatus = await banMember(memberId, commandMessage.guild.members);
			if(banStatus === "Missing Permissions") { // check if ban was successful or not
				sendMessageToChannel(commandMessage.channel, ":x: Error : I don't have the permission to ban this member.");
			} else {
				if (expirationDate !== "") { // temp ban
					setTimeout(() => {
						unbanMember(memberId, commandMessage.guild.members);
					}, parseDate(expirationDate).getTime() - commandMessage.createdAt.getTime());
				}
			}
		}
	}
};

const detailsCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&details */i, "").split(" ").filter(word => word !== "");
	let unknownElements = [];
	for (let word of commandArguments) {
		if (/^[iwb]#[0-9]+$/.test(word)) { // match id format
			let matchingElement = readInfoData(infoTypeFromIdFirstLetter[word[0]]).find(element => element.id === word);
			if (matchingElement) { // found a matching element, send information
				sendEmbedToChannel(commandMessage.channel, buildEmbedElementDetails(matchingElement));
			} else { // unknown element
				unknownElements.push(word);
			}
		} else { // wrong id format
			sendMessageToChannel(commandMessage.channel, ":x: Error : bad id format.\n\n" + detailsHelpMessage);
		}
	}
	if (unknownElements.length) {
		sendMessageToChannel(commandMessage.channel, `:x: Error : failed to find element(s) : ${unknownElements.join(", ")}.`);
	}
};

const removeCommand = message => {
	let argumentsString = message.content.replace(/^&remove */i,"");
	let {typesElementsSuccessfullyRemoved, failed} = removeElements(argumentsString, message);
	for (let infoType in typesElementsSuccessfullyRemoved) {
		sendEmbedToChannel(message.channel, buildEmbedElementList(infoType));
	}
	if (failed.length) {
		sendMessageToChannel(message.channel, ":x: Failed to remove :\n- " + failed.join("\n- "));
	}
};

const unbanCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&unban */i, "");
	let {memberId} = getMemberIdAndRestOfCommand(commandArguments, commandMessage.client.memberList); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + unbanHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + unbanHelpMessage);
	} else {
		let policeBotBanData = readInfoData("bans");
		let banIndex = policeBotBanData.findIndex(ban => ban.memberId === memberId); // find the ban corresponding to the memberId
		if (banIndex === -1) {
			sendMessageToChannel(commandMessage.channel, ":x: Error : member is not banned.\n\n" + unbanHelpMessage);
		} else {
			unbanMember(memberId, commandMessage.guild.members); // unban member
			policeBotBanData[banIndex].expirationDate = getReadableDate(new Date()); // end the ban
			writeInfoData(policeBotBanData, "bans"); // save modification
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("bans"));
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
		if (/^([0-9]{18})$/.test(listOfWords[0])) { // first word has the form of an id (18 digits)
			return {
				memberId: getMemberFromId(listOfWords[0], memberList),
				restOfCommand: listOfWords.slice(1).join(" ")
			}
		} else {
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

const getReasonAndLinkedInfractions = argumentsString => {
	let reasonArray = [], existingInfractions = [], nonExistingInfractions = [];
	let allInfractions = readInfoData("infractions");
	for (let word of argumentsString.split(" ").filter(word => word !== "")) {
		if (/^i#[0-9]+$/i.test(word)) { // word matches an infraction id
			if (allInfractions.find(infraction => infraction.id === word)) { // infraction id exists
				existingInfractions.push(word);
			} else { // infractions id doesn't exist
				nonExistingInfractions.push(word);
			}
		} else { // normal word
			reasonArray.push(word);
		}
	}
	return {
		reason: reasonArray.join(" "),
		linkedInfractions: existingInfractions.join(" "),
		notLinkedInfractions: nonExistingInfractions
	};
};

const getReasonLinkedWarnsAndExpirationDate = argumentsString => {
	let reasonArray = [], existingWarns = [], nonExistingWarns = [], expirationDate = "";
	let allWarns = readInfoData("warns");
	for (let word of argumentsString.split(" ").filter(word => word !== "")) {
		if (/^w#[0-9]+$/i.test(word)) { // word matches a warn id
			if (allWarns.find(warn => warn.id === word)) { // warn id exists
				existingWarns.push(word);
			} else { // warn id doesn't exist
				nonExistingWarns.push(word);
			}
		} else if (/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(word)) { // word matches a date
			expirationDate = (getReadableDate(parseDate(word)) + "").substring(0, 10); // clean date before saving it
		} else { // normal word
			reasonArray.push(word);
		}
	}
	return {
		reason: reasonArray.join(" "),
		linkedWarns: existingWarns.join(" "),
		notLinkedWarns: nonExistingWarns,
		expirationDate: expirationDate
	}
};

const removeElements = (argumentsString, message) => {
	let elementsIdToRemove = argumentsString.split(" ").filter(word => word !== "");
	let typesElementsSuccessfullyRemoved = [], failed = [];
	let policeBotData = readPoliceBotData();
	for (let elementIdToRemove of elementsIdToRemove) {
		if (/[iwb]#[0-9]+/.test(elementIdToRemove)) { // infraction, warn or ban to remove
			let elementType = infoTypeFromIdFirstLetter[elementIdToRemove[0]];
			let indexToRemove = policeBotData[elementType].findIndex(element => element.id === elementIdToRemove);
			if (indexToRemove === -1) { // id doesn't exist
				failed.push(elementIdToRemove);
			} else { // id exists, remove the infraction of warn
				if (elementType === "bans") {
					let memberId = policeBotData["bans"][indexToRemove].memberId;
					unbanMember(memberId, message.guild.members); // unban the member
				}
				removePoliceBotData(elementType, indexToRemove);
				policeBotData = readPoliceBotData();
				typesElementsSuccessfullyRemoved[elementType] = true;
			}
		} else {
			failed.push(elementIdToRemove);
		}
	}
	return {
		typesElementsSuccessfullyRemoved: typesElementsSuccessfullyRemoved,
		failed: failed
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
	let currentDate = new Date();
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

module.exports = {addInfractionCommand, addWarnCommand, addBanCommand, detailsCommand, removeCommand, unbanCommand, reloadTempBans};
