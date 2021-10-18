"use strict";

const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {buildElementDetailsEmbed, buildDiscussionDetailsEmbeds} = require("./messageBuilder.js");
const {readPoliceBotData, removePoliceBotData, readInfoData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {unbanMember} = require("./members.js");
const {getCurrentDate} = require("./date.js");
const {detailsHelpMessage, removeHelpMessage} = require("./helpMessages.js");

const removeCommand = async message => {
	let elementsIdToRemove = [...new Set( // keep uniques values
		message.content.replace(/^&remove */i,"").split(" ").filter(word => word !== "")
	)];
	let policeBotData = readPoliceBotData();
	let elementsToBeRemoved = [];
	let failedElements = {incorrectIdFormat: [], notFound: []};
	let successfullyRemovedElements = {infractions: [], warns: [], bans: [], discussions: []};
	for (let elementId of elementsIdToRemove) {
		if (!/[iwbd]#[0-9]+/.test(elementId)) { // check id format
			failedElements.incorrectIdFormat.push(elementId);
		} else {
			let elementType = infoTypeFromIdFirstLetter[elementId[0]];
			let indexToRemove = policeBotData[elementType].findIndex(element => element.id === elementId);
			if (indexToRemove === -1) { // check existence
				failedElements.notFound.push(elementId);
			} else {
				if (elementType === "bans") {
					let memberId = policeBotData["bans"][indexToRemove].memberId;
					unbanMember(memberId, message.guild.members); // unban the member
				}
				elementsToBeRemoved.push(elementId);
				successfullyRemovedElements[elementType].push(elementId);
			}
		}
	}
	removePoliceBotData(elementsToBeRemoved);
	await logRemovedElements(message, successfullyRemovedElements, failedElements);
};

const logRemovedElements = async (commandMessage, successfullyRemovedElements, failedElements) => {
	if (successfullyRemovedElements.infractions.length) {
		await sendMessageToChannel(commandMessage.channel,
			(successfullyRemovedElements.infractions.length === 1 ? "L'infraction suivante a été supprimée : "
				: "Les infractions suivantes ont été supprimées : ") + successfullyRemovedElements.infractions.join(", ")
		);
	}
	if (successfullyRemovedElements.warns.length) {
		await sendMessageToChannel(commandMessage.channel,
			(successfullyRemovedElements.warns.length === 1 ? "Le warn suivant a été supprimé : "
				: "Les warns suivants ont été supprimés : ") + successfullyRemovedElements.warns.join(", ")
		);
	}
	if (successfullyRemovedElements.bans.length) {
		await sendMessageToChannel(commandMessage.channel,
			(successfullyRemovedElements.bans.length === 1
				? "Le ban suivant a été supprimé, et le membre a été débanni : "
				: "Les bans suivants ont été supprimés, et les membres ont été débannis : ")
			+ successfullyRemovedElements.bans.join(", ")
		);
	}
	if (successfullyRemovedElements.discussions.length) {
		await sendMessageToChannel(commandMessage.channel,
			(successfullyRemovedElements.discussions.length === 1
				? "La discussion suivante a été supprimée : "
				: "Les discussions suivantes ont été supprimées : ")
			+ successfullyRemovedElements.discussions.join(", ")
		);
	}
	if (failedElements.incorrectIdFormat.length) {
		await sendMessageToChannel(commandMessage.channel,
			(failedElements.incorrectIdFormat.length === 1
				? ":x: L'élément suivant n'a pas pu être supprimé, car l'id spécifié n'a pas le bon format : "
				: ":x: Les éléments suivants n'ont pas pu être supprimés, car les id spécifiés n'ont pas le bon format : ")
			+ failedElements.incorrectIdFormat.join(", ")
			+ "\n" + removeHelpMessage
		);
	}
	if (failedElements.notFound.length) {
		await sendMessageToChannel(commandMessage.channel,
			(failedElements.notFound.length === 1
				? ":x: L'élément suivant n'a pas pu être supprimé, car il n'a pas été trouvé : "
				: ":x: Les éléments suivants n'ont pas pu être supprimés, car ils n'ont pas été trouvés : ")
			+ failedElements.notFound.join(", ")
		);
	}
};

const detailsCommand = commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&details */i, "").split(" ").filter(word => word !== "");
	let unknownElements = [];
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
					sendEmbedToChannel(commandMessage.channel, buildElementDetailsEmbed(matchingElement));
				}
			} else { // unknown element
				unknownElements.push(word);
			}
		} else { // wrong id format
			sendMessageToChannel(commandMessage.channel, ":x: Erreur : mauvais format d'id.\n\n" + detailsHelpMessage);
		}
	}
	if (unknownElements.length) {
		sendMessageToChannel(commandMessage.channel, `:x: Erreur : impossible de trouver ${unknownElements.join(", ")}.`);
	}
};

module.exports = {removeCommand, detailsCommand};
