"use strict";

const {sendMessageToChannel, sendEmbedToChannel} = require("./messages.js");
const {buildElementDetailsEmbed, buildDiscussionDetailsEmbeds} = require("./messageBuilder.js");
const {removeBulkData, readInfoData, groupElementsIdByType, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {banIsActive} = require("./infractionsWarnsBans.js");
const {unbanMember} = require("./members.js");
const {getCurrentDate} = require("./date.js");
const {detailsHelpMessage, removeHelpMessage} = require("./helpMessages.js");

const removeCommand = async message => {
	let elementsIdToRemove = [...new Set( // keep uniques values
		message.content.replace(/^&remove */i,"").split(" ").filter(word => word !== "")
	)];
	let {correctIdFormat, incorrectIdFormatElements} = checkIdFormat(elementsIdToRemove);
	let {elementsToBeRemoved, notFoundElements, membersToUnban} = await checkExistence(correctIdFormat);
	for (let memberIdToUnban of membersToUnban) {
		unbanMember(memberIdToUnban, message.guild.members);
	}
	await removeBulkData(elementsToBeRemoved);
	await logRemovedElements(message, groupElementsIdByType(elementsToBeRemoved), incorrectIdFormatElements, notFoundElements);
};

const checkIdFormat = elementsIdToRemove => {
	let correctIdFormat = [], incorrectIdFormatElements = [];
	for (let elementId of elementsIdToRemove) {
		(/[iwbd]#[0-9]+/.test(elementId) ? correctIdFormat : incorrectIdFormatElements).push(elementId);
	}
	return {correctIdFormat, incorrectIdFormatElements};
};

const checkExistence = async elementsIdToRemove => {
	let elementsToBeRemoved = [], notFoundElements = [], membersToUnban = [];
	let elementsIdGroupedByType = groupElementsIdByType(elementsIdToRemove);
	for (let elementType in elementsIdGroupedByType) {
		let elementsId = elementsIdGroupedByType[elementType];
		let dataOfThisType = await readInfoData(elementType);
		for (let elementId of elementsId) {
			let index = dataOfThisType.findIndex(element => element.id === elementId);
			((index) !== -1 ? elementsToBeRemoved : notFoundElements).push(elementId);
			if (elementType === "bans") {
				let ban = dataOfThisType[index];
				if (banIsActive(ban, getCurrentDate())) {
					membersToUnban.push(ban.memberId);
				}
			}
		}
	}
	return {elementsToBeRemoved, notFoundElements, membersToUnban};
};

const logRemovedElements = async (commandMessage, elementsIdRemovedGroupedByType, incorrectIdFormatElements, notFoundElements) => {
	if (elementsIdRemovedGroupedByType.infractions.length) {
		await sendMessageToChannel(commandMessage.channel,
			(elementsIdRemovedGroupedByType.infractions.length === 1 ? "L'infraction suivante a été supprimée : "
				: "Les infractions suivantes ont été supprimées : ") + elementsIdRemovedGroupedByType.infractions.join(", ")
		);
	}
	if (elementsIdRemovedGroupedByType.warns.length) {
		await sendMessageToChannel(commandMessage.channel,
			(elementsIdRemovedGroupedByType.warns.length === 1 ? "Le warn suivant a été supprimé : "
				: "Les warns suivants ont été supprimés : ") + elementsIdRemovedGroupedByType.warns.join(", ")
		);
	}
	if (elementsIdRemovedGroupedByType.bans.length) {
		await sendMessageToChannel(commandMessage.channel,
			(elementsIdRemovedGroupedByType.bans.length === 1
				? "Le ban suivant a été supprimé, et le membre à débannir a été débanni : "
				: "Les bans suivants ont été supprimés, et les membres à débannir ont été débannis : ")
			+ elementsIdRemovedGroupedByType.bans.join(", ")
		);
	}
	if (elementsIdRemovedGroupedByType.discussions.length) {
		await sendMessageToChannel(commandMessage.channel,
			(elementsIdRemovedGroupedByType.discussions.length === 1
				? "La discussion suivante a été supprimée : "
				: "Les discussions suivantes ont été supprimées : ")
			+ elementsIdRemovedGroupedByType.discussions.join(", ")
		);
	}
	if (incorrectIdFormatElements.length) {
		await sendMessageToChannel(commandMessage.channel,
			(incorrectIdFormatElements.length === 1
				? ":x: L'élément suivant n'a pas pu être supprimé, car l'id spécifié n'a pas le bon format : "
				: ":x: Les éléments suivants n'ont pas pu être supprimés, car les id spécifiés n'ont pas le bon format : ")
			+ incorrectIdFormatElements.join(", ")
			+ "\n" + removeHelpMessage
		);
	}
	if (notFoundElements.length) {
		await sendMessageToChannel(commandMessage.channel,
			(notFoundElements.length === 1
				? ":x: L'élément suivant n'a pas pu être supprimé, car il n'a pas été trouvé : "
				: ":x: Les éléments suivants n'ont pas pu être supprimés, car ils n'ont pas été trouvés : ")
			+ notFoundElements.join(", ")
		);
	}
};

const detailsCommand = async commandMessage => {
	let commandArguments = commandMessage.content.replace(/^&details */i, "").split(" ").filter(word => word !== "");
	let unknownElements = [];
	for (let word of commandArguments) {
		if (/^[iwbd]#[0-9]+$/.test(word)) { // match id format of infraction, warn, ban or discussion
			let matchingElement = (await readInfoData(infoTypeFromIdFirstLetter[word[0]])).find(element => element.id === word);
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
