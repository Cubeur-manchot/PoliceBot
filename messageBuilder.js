"use strict";

const {groupElementsByMemberId, readInfoData} = require("./dataManipulation.js");

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

module.exports = {addInfractionHelpMessage, addWarnHelpMessage, buildEmbedElementList};
