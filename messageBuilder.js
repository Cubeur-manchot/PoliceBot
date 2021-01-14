"use strict";

const {groupElementsByMemberId, readInfoData, parseDate, getReadableDiffDate, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");

const addInfractionHelpMessage = "```\n&addInfraction <member> <type> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<type>` : the type of infraction. Ex: HS, Bad words, ..."
	+ "\n`<commentary>` (optional) : gives more information about the infraction."
	+ "\n\nExample : ```\n&addInfraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

const addWarnHelpMessage = "```\n&addWarn <member> <reason> <infractionId> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<reason>` : the reason of the warn. Ex: HS répétitifs, Bad words, ..."
	+ "\n`<infractionId>` (optional) : the infraction(s) to be attached to the warn. Ex: i#1 i#3"
	+ "\n`<commentary>` (optional) : gives more information about the warn."
	+ "\n\nExample : ```\n&addWarn Cubeur-manchot#7706 HS répétitifs i#1 i#3 // c'est relou```";

const detailsHelpMessage = "```&details <elementId>```"
	+ "`<elementId>` : the id of the element you want details (infraction, warn or ban). Ex: i#1"
	+ "\n\nExample : ```\n&details i#1```";

const removeHelpMessage = "```\n&remove <elementId>```"
	+ "`<elementId>` is the id of the element (infraction, warn, ban) to remove/revoke."
	+ "\nIt can remove many elements at once."
	+ "\n\nExample: ```\n&remove i#3 i#4 w#1```";

const embedColorFromType = {
	"infractions": "#cccc00",
	"warns": "#d56600",
	"bans": "#fc0000"
};

const emojiWhenNoElement = {
	"infractions": ":innocent:",
	"warns": ":thumbsup:",
	"bans": ":peace:"
};

const buildEmbedElementList = infoType => {
	let embedObject = {
		color: embedColorFromType[infoType],
		title: `__${infoType[0].toUpperCase()}${infoType.slice(1)}__`
	};
	let typeOrReason = infoType === "infractions" ? "type" : "reason";
	let elements = readInfoData(infoType);
	if (elements.length === 0) {
		embedObject.description = `No current ${infoType.slice(0,-1)} ${emojiWhenNoElement[infoType]}`;
	} else {
		embedObject.description = `Here is the list of all ${infoType} :\n`;
		let elementsGroupedByMemberId = groupElementsByMemberId(elements);
		for (let memberId in elementsGroupedByMemberId) {
			let memberElements = elementsGroupedByMemberId[memberId];
			embedObject.description += `\n<@${memberId}> (${memberElements.length}) :\n`;
			embedObject.description += "`Id  ` `Date      ` `" + (infoType === "infractions" ? "Type  " : "Reason") + "        `";
			for (let element of memberElements) {
				embedObject.description += "\n`" + element.id + (element.id.length === 3 ? " " : "")
					+ "` `" + element.date.substring(0,10) + "` `";
				let elementTypeOrReason = element[typeOrReason];
				if (elementTypeOrReason.length > 14) {
					embedObject.description += elementTypeOrReason.substring(0,11) + "..."; // cut before end, and add "..."
				} else {
					embedObject.description += elementTypeOrReason + " ".repeat(14 - elementTypeOrReason.length); // complete with spaces at the end
				}
				embedObject.description += "`";
			}
		}
	}
	return embedObject;
};

const buildEmbedElementDetails = element => {
	let infoType = infoTypeFromIdFirstLetter[element.id[0]];
	let description = `**Member** : <@${element.memberId}>`; // member
	description += `\n**Date** : ${element.date} (${getReadableDiffDate(new Date(), parseDate(element.date))} ago)`; // date
	if (infoType === "infractions") {
		description += `\n**Type** : ${element.type}`; // infraction type
	} else {
		if (infoType === "bans") {
			description += `\n**Expiration date** : ${element.expirationDate} (${getReadableDiffDate(parseDate(element.expirationDate), new Date())} remaining)`; // date
		}
		description += `\n**Reason** : ${element.reason}`; // warn or ban reason
		if (infoType === "warns") {
			description += `\n**Linked infractions** : ${element.infractions === "" ? "none" : element.infractions.replace(/ /g, ", ")}`; // linked infractions for warns
		} else {
			description += `\n**Linked warns** : ${element.warns === "" ? "none" : element.warns.replace(/ /g, ", ")}`; // linked warns for bans
		}
	}
	description += `\n**Commentary** : ${element.commentary === "" ? "none" : element.commentary}`;
	return {
		color: embedColorFromType[infoType], // color
		title: `__Details of ${infoType.slice(0, -1)} ${element.id}__`, // id
		description: description // description
	};
};

module.exports = {addInfractionHelpMessage, addWarnHelpMessage, detailsHelpMessage, removeHelpMessage, buildEmbedElementList, buildEmbedElementDetails};
