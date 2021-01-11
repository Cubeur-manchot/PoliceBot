"use strict";

const {getAvailableId, getReadableDate, readInfoData, writeInfoData, groupElementsByMemberId} = require("./dataManipulation.js");
const {sendMessageToChannel, sendEmbedToChannel} = require("./messageHandler.js");

const buildEmbedInfractionsList = infractions => {
	let embedObject = {
		color: "#cccc00",
		title: "__Infractions__",
	};
	if (infractions.length === 0) {
		embedObject.description = "No current infraction :innocent:";
	} else {
		embedObject.description = "Here is the list of all infractions :\n";
		let infractionsBuffer = groupElementsByMemberId(infractions);
		for (let memberId in infractionsBuffer) {
			let memberInfractions = infractionsBuffer[memberId];
			embedObject.description += `\n<@${memberId}> (${memberInfractions.length}) :\n`;
			embedObject.description += "`Id  ` `Date      ` `Type          `";
			for (let infraction of memberInfractions) {
				embedObject.description += "\n`" + infraction.id + (infraction.id.length === 3 ? " " : "")
					+ "` `" + infraction.date.substring(0,10) + "` `";
				if (infraction.type.length > 14) {
					embedObject.description += infraction.type.substring(0,11) + "..."; // cut before end, and add "..."
				} else {
					embedObject.description += infraction.type + " ".repeat(14 - infraction.type.length); // complete with spaces at the end
				}
				embedObject.description += "`";
			}
		}
	}
	return embedObject;
};

const addInfractionCommand = commandMessage => {
	let infractionId = getAvailableId("infractions");
	let infractionDate = getReadableDate(commandMessage.createdAt);
	let infractionCommentary, beginCommand;
	let commandArguments = commandMessage.content.replace(/^&addinfraction */i, "");
	if (commandMessage.content.includes("//")) {
		[beginCommand, infractionCommentary] = commandArguments.split("//");
		infractionCommentary = infractionCommentary.replace(/\/\/ */, "");
	} else {
		beginCommand = commandArguments;
		infractionCommentary = "";
	}
	beginCommand = beginCommand.trim();
	let {memberId, infractionType} = getMemberIdAndInfractionType(beginCommand, commandMessage.channel.guild.members.cache);
	if (!memberId) {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified or unrecognized member.\n\n" + infractionHelpMessage);
	} else if (memberId === "many") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : many matching members.\n\n" + infractionHelpMessage);
	} else if (infractionType === "") {
		sendMessageToChannel(commandMessage.channel, ":x: Error : unspecified infraction type.\n\n" + infractionHelpMessage);
	} else {
		writeInfoData({
			id: infractionId,
			memberId: memberId,
			date: infractionDate,
			type: infractionType,
			commentary: infractionCommentary
		}, "infractions");
		sendEmbedToChannel(commandMessage.channel, buildEmbedInfractionsList(readInfoData("infractions")));
	}
};

const getMemberIdAndInfractionType = (messageContent, memberList) => {
	let listOfWords = messageContent.split(" ").filter(word => word !== "");
	if (listOfWords.length === 0) { // no argument
		return {
			memberId: undefined,
			infractionType: ""
		}
	} else {
		if (/^([0-9]{18})$/.test(listOfWords[0])) { // first word has the form of an id (18 digits)
			return {
				memberId: memberList.get(listOfWords[0]) ? listOfWords[0] : undefined,
				infractionType: listOfWords.slice(1).join(" ")
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
						infractionType: listOfWords.join(" ")
					}
				} else if (foundMembers.length > 1) { // many matches
					return {
						memberId: "many",
						infractionType: listOfWords.join(" ")
					}
				} // else no match, ignore
			}
			return { // no member has been found
				memberId: undefined,
				infractionType: listOfWords.join(" ")
			}
		}
	}
};

module.exports = {buildEmbedInfractionsList, addInfractionCommand};
