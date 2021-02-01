"use strict";

const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {buildEmbedElementList} = require("./messageBuilder.js");
const {readPoliceBotData, removePoliceBotData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {unbanMember} = require("./members.js");

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

module.exports = {removeCommand};
