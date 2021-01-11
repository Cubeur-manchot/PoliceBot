"use strict";

const {getAvailableId, getReadableDate, readInfoData, writeInfoData} = require("./dataManipulation.js");
const {sendMessageToChannel, sendEmbedToChannel} = require("./messageHandler.js");
const {buildEmbedElementList, addInfractionHelpMessage, addWarnHelpMessage} = require("./messageBuilder.js");

const addInfractionCommand = commandMessage => {
	let infractionId = getAvailableId("infractions");
	let infractionDate = getReadableDate(commandMessage.createdAt);
	let infractionCommentary, beginCommand;
	let commandArguments = commandMessage.content.replace(/^&addinfraction */i, "");
	if (commandMessage.content.includes("//")) { // split comments from the rest of the arguments
		[beginCommand, infractionCommentary] = commandArguments.split("//");
		infractionCommentary = infractionCommentary.trim();
	} else {
		beginCommand = commandArguments;
		infractionCommentary = "";
	}
	beginCommand = beginCommand.trim();
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.channel.guild.members.cache); // parse memberId and infractionType
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + addInfractionHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + addInfractionHelpMessage);
	} else if (restOfCommand === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified infraction type.\n\n" + addInfractionHelpMessage);
	} else {
		writeInfoData({
			id: infractionId,
			memberId: memberId,
			date: infractionDate,
			type: restOfCommand,
			commentary: infractionCommentary
		}, "infractions");
		sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("infractions"));
	}
};

const addWarnCommand = commandMessage => {
	let warnId = getAvailableId("warns");
	let warnDate = getReadableDate(commandMessage.createdAt);
	let warnCommentary, beginCommand;
	let commandArguments = commandMessage.content.replace(/^&addwarn */i, "");
	if (commandMessage.content.includes("//")) {
		[beginCommand, warnCommentary] = commandArguments.split("//");
		warnCommentary = warnCommentary.trim();
	} else {
		beginCommand = commandArguments;
		warnCommentary = "";
	}
	beginCommand = beginCommand.trim();
	let {memberId, restOfCommand} = getMemberIdAndRestOfCommand(beginCommand, commandMessage.channel.guild.members.cache); // parse memberId
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + addInfractionHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + addInfractionHelpMessage);
	} else if (restOfCommand === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified warn reason.\n\n" + addInfractionHelpMessage);
	} else {
		let {reason, linkedInfractions, unlinkedInfractions} = getReasonAndLinkedInfractions(restOfCommand);
		if (unlinkedInfractions.length) {
			sendMessageToChannel(commandMessage.channel, `:x: Error : failed to link infraction(s) : ${unlinkedInfractions.join(", ")}.`);
		} else {
			writeInfoData({
				id: warnId,
				memberId: memberId,
				date: warnDate,
				reason: reason,
				infractions: linkedInfractions,
				commentary: warnCommentary
			}, "warns");
			sendEmbedToChannel(commandMessage.channel, buildEmbedElementList("warns"));
		}
	}
};

const getMemberIdAndRestOfCommand = (messageContent, memberList) => {
	let listOfWords = messageContent.split(" ").filter(word => word !== "");
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
		if (/^[iwb]#[0-9]+$/i.test(word)) { // word matches an id
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
		unlinkedInfractions: nonExistingInfractions
	};
};

module.exports = {addInfractionCommand, addWarnCommand};
