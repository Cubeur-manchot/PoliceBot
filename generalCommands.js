"use strict";

const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {buildElementListEmbed, buildElementDetailsEmbed, buildDiscussionDetailsEmbeds} = require("./messageBuilder.js");
const {readPoliceBotData, removePoliceBotData, readInfoData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {unbanMember} = require("./members.js");
const {detailsHelpMessage} = require("./helpMessages.js");

const removeCommand = message => {
	let argumentsString = message.content.replace(/^&remove */i,"");
	let {typesElementsSuccessfullyRemoved, failed} = removeElements(argumentsString, message);
	for (let infoType in typesElementsSuccessfullyRemoved) {
		for (let embed of buildElementListEmbed(infoType)) {
			sendEmbedToChannel(message.channel, embed);
		}
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
		if (/[iwbd]#[0-9]+/.test(elementIdToRemove)) { // infraction, warn or ban to remove
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

const detailsCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&details */i, "").split(" ").filter(word => word !== "");
	let unknownElements = [];
	let timezoneOffset = readInfoData("timezoneOffset");
	for (let word of commandArguments) {
		if (/^[iwbd]#[0-9]+$/.test(word)) { // match id format of infraction, warn, ban or discussion
			let matchingElement = readInfoData(infoTypeFromIdFirstLetter[word[0]]).find(element => element.id === word);
			if (matchingElement) { // found a matching element, send information
				if (word.includes("d")) {
					let embedList = buildDiscussionDetailsEmbeds(matchingElement, "normal");
					for (let embed of embedList) {
						sendEmbedToChannel(commandMessage.channel, embed);
					}
				} else {
					sendEmbedToChannel(commandMessage.channel, buildElementDetailsEmbed(matchingElement, timezoneOffset));
				}
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

module.exports = {removeCommand, detailsCommand};
