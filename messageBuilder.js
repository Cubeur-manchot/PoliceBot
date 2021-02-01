"use strict";

const {groupElementsByMemberId, readInfoData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {parseDate, getReadableDiffDate} = require("./date.js");

const embedColorFromType = {
	"infractions": "#cccc00",
	"warns": "#d56600",
	"bans": "#fc0000",
	"discussions": "#666666"
};

const emojiWhenNoElement = {
	"infractions": ":innocent:",
	"warns": ":thumbsup:",
	"bans": ":peace:",
	"discussions": ":zipper_mouth:"
};

const buildEmbedElementList = infoType => {
	let embedObject = {
		color: embedColorFromType[infoType],
		title: `__${infoType[0].toUpperCase()}${infoType.slice(1)}__`
	};
	let elements = readInfoData(infoType);
	if (elements.length === 0) {
		embedObject.description = `No current ${infoType.slice(0,-1)} ${emojiWhenNoElement[infoType]}`;
	} else {
		embedObject.description = `Here is the list of all ${infoType} :\n`;
		if (infoType === "discussions") { // discussions : display simple list
			for (let savedDiscussion of elements) {
				embedObject.description += "\n`"
					+ savedDiscussion.id + (savedDiscussion.id.length === 3 ? " " : "")
					+ "` `" + savedDiscussion.savingDate.substring(0,10)
					+ "` <#" + savedDiscussion.channelId
					+ ">";
			}
		} else { // infractions, warns and bans : group by member
			let typeOrReason = infoType === "infractions" ? "type" : "reason";
			let elementsGroupedByMemberId = groupElementsByMemberId(elements);
			for (let memberId in elementsGroupedByMemberId) {
				let memberElements = elementsGroupedByMemberId[memberId];
				embedObject.description += `\n<@${memberId}> (${memberElements.length}) :\n`;
				embedObject.description += "`Id  ` `Date      ` `" + (infoType === "infractions" ? "Type  " : "Reason") + "        `";
				for (let element of memberElements) {
					embedObject.description += "\n`" + element.id + (element.id.length === 3 ? " " : "")
						+ "` `" + element.date.substring(0, 10) + "` `";
					let elementTypeOrReason = element[typeOrReason];
					if (elementTypeOrReason.length > 14) {
						embedObject.description += elementTypeOrReason.substring(0, 11) + "..."; // cut before end, and add "..."
					} else {
						embedObject.description += elementTypeOrReason + " ".repeat(14 - elementTypeOrReason.length); // complete with spaces at the end
					}
					embedObject.description += "`";
				}
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
			description += "\n**Expiration date** : "; // expiration date
			if (element.expirationDate === "") {
				description += "None (definitive ban)";
			} else {
				let currentDate = new Date();
				let expirationDate = parseDate(element.expirationDate);
				description += (currentDate < expirationDate
						? `${element.expirationDate} (${getReadableDiffDate(expirationDate, currentDate)} remaining)`
						: `${element.expirationDate} (finished ${getReadableDiffDate(currentDate, expirationDate)} ago)`);
			}
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

	} else {
		}
	}
};

module.exports = {buildEmbedElementList, buildEmbedElementDetails, buildEmbedDiscussionList};
