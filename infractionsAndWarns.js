"use strict";

const {getAvailableId, getReadableDate, parseDate, readInfoData, addInfoData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {sendMessageToChannel, sendEmbedToChannel} = require("./messageHandler.js");
const {buildEmbedElementList, buildEmbedElementDetails} = require("./messageBuilder.js");
const {addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, detailsHelpMessage} = require("./helpMessages.js");

const addInfractionCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&addinfraction */i, "");
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandArguments);
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.channel.guild.members.cache); // parse memberId and infractionType
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
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.channel.guild.members.cache); // parse memberId
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

const addBanCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&(add)?ban */i, "");
	let {beginCommand, commentary} = getCommentaryAndRestOfCommand(commandArguments);
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.channel.guild.members.cache); // parse memberId
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
				id: getAvailableId("warns"),
				memberId: memberId,
				date: getReadableDate(commandMessage.createdAt),
				expirationDate: expirationDate,
				reason: reason,
				warns: linkedWarns,
				commentary: commentary
			}, "bans");
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("bans"));
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
				memberId: memberList.get(listOfWords[0]) ? listOfWords[0] : undefined,
				restOfCommand: listOfWords.slice(1).join(" ")
			}
		} else {
			let firstPart = "";
			let secondPart = listOfWords;
			while (secondPart.length !== 0) {
				firstPart += (firstPart === "" ? "" : " ") + secondPart.shift();
				let foundMembers = memberList.filter(member =>
					member.nickname === firstPart // matches pseudo in server
					|| member.user.username === firstPart // matches username in Discord
					|| member.user.tag === firstPart // match username + tag number in Discord
				).array();
				if (foundMembers.length === 1) { // unique match
					return {
						memberId: foundMembers[0].id,
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

module.exports = {addInfractionCommand, addWarnCommand, addBanCommand, detailsCommand};
