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

const buildElementListEmbed = infoType => {
	let elements = readInfoData(infoType);
	let descriptionChunks = [];
	if (elements.length) {
		descriptionChunks.push(`Here is the list of all ${infoType} :\n`);
		if (infoType === "discussions") { // discussions : display simple list
			for (let savedDiscussion of elements) {
				descriptionChunks.push("\n`"
					+ savedDiscussion.id + (savedDiscussion.id.length === 3 ? " " : "")
					+ "` `" + savedDiscussion.savingDate.substring(0,10)
					+ "` <#" + savedDiscussion.channelId
					+ ">");
			}
		} else { // infractions, warns and bans : group by member
			let typeOrReason = infoType === "infractions" ? "type" : "reason";
			let elementsGroupedByMemberId = groupElementsByMemberId(elements);
			for (let memberId in elementsGroupedByMemberId) {
				let memberElements = elementsGroupedByMemberId[memberId];
				descriptionChunks.push(`\n<@${memberId}> (${memberElements.length}) :\n`);
				descriptionChunks.push("`Id  ` `Date      ` `" + (infoType === "infractions" ? "Type  " : "Reason") + "        `");
				for (let element of memberElements) {
					descriptionChunks.push("\n`" + element.id + (element.id.length === 3 ? " " : "")
						+ "` `" + element.date.substring(0, 10) + "` `");
					let elementTypeOrReason = element[typeOrReason];
					if (elementTypeOrReason.length > 14) {
						descriptionChunks.push(elementTypeOrReason.substring(0, 11) + "..."); // cut before end, and add "..."
					} else {
						descriptionChunks.push(elementTypeOrReason + " ".repeat(14 - elementTypeOrReason.length)); // complete with spaces at the end
					}
					descriptionChunks.push("`");
				}
			}
		}
	} else {
		descriptionChunks.push(`No current ${infoType.slice(0, -1)} ${emojiWhenNoElement[infoType]}`);
	}
	let embedList = buildEmbedsFromDescriptionChunks(descriptionChunks);
	for (let embed of embedList) {
		embed.color = embedColorFromType[infoType];
	}
	embedList[0].title = `__${infoType[0].toUpperCase()}${infoType.slice(1)}__`;
	return embedList;
};

const buildEmbedsFromDescriptionChunks = descriptionChunks => {
	if (descriptionChunks.length) {
		let embedList = [];
		let currentDescription = "";
		for (let descriptionChunk of descriptionChunks) {
			if (currentDescription.length + descriptionChunk.length <= 2048) {
				currentDescription += descriptionChunk;
			} else {
				embedList.push({
					description: currentDescription
				});
				currentDescription = descriptionChunk;
			}
		}
		embedList.push({
			description: currentDescription
		});
		return embedList;
	} else {
		return [];
	}
};

const buildElementDetailsEmbed = element => {
	let infoType = infoTypeFromIdFirstLetter[element.id[0]];
	let description = `**Member** : <@${element.memberId}>`; // member
	let diffDate = getReadableDiffDate(new Date(), parseDate(element.date));
	description += `\n**Date** : ${element.date} `;
	if (diffDate === "equals") {
		description += "(just now)";
	} else {
		description += `(${diffDate} ago)`;
	}
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
				description += element.expirationDate;
				if (currentDate < expirationDate) {
					let banExpirationDiffDate = getReadableDiffDate(expirationDate, currentDate);
					if (banExpirationDiffDate === "equals") {
						description += " (just now)";
					} else {
						description += ` (${banExpirationDiffDate} remaining)`;
					}
				} else {
					let banExpiredDiffDate = getReadableDiffDate(currentDate, expirationDate);
					if (banExpiredDiffDate === "equals") {
						description += " (just now)";
					} else {
						description += ` (finished ${banExpiredDiffDate} ago)`;
					}
				}
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

const buildDiscussionPurgedOrSavedFrenchMessage = (nbMessages, purge) => {
	return `${nbMessages} message${nbMessages > 1 ? "s ont été" : " a été"} ${purge ? "supprimé" : "sauvegardé"}${nbMessages > 1 ? "s" : ""}`;
};

const buildDiscussionPurgedOrSavedMessage = (nbMessages, channelId, discussionId, purge) => {
	return `${nbMessages} message${nbMessages > 1 ? "s were" : " was"} ${purge ? "purged" : "saved"} in channel <#${channelId}> (${discussionId})`;
};

const buildDiscussionMovedFrenchMessage = (nbMessages, destinationChannelId) => {
	return `${nbMessages} message${nbMessages > 1 ? "s ont été déplacés" : " a été déplacé"} vers le salon <#${destinationChannelId}>`;
};

const buildDiscussionMovedMessage = (nbMessages, originChannelId, destinationChannelId, discussionId) => {
	return `${nbMessages} message${nbMessages > 1 ? "s were" : "was"} moved from <#${originChannelId}> to <#${destinationChannelId}> (${discussionId})`;
};

const buildDiscussionDetailsEmbeds = (discussion, mode) => {
	let embedList = [];
	let currentDescription = mode === "moved french"
		? `Le : ${discussion.savingDate}\nSalon d'origine : <#${discussion.channelId}>`
		: `Saving date : ${discussion.savingDate}\nChannel : <#${discussion.channelId}>\nCommand : \`&${discussion.action}\``;
	if (discussion.messages.length) {
		let currentDay = "";
		for (let message of discussion.messages) {
			let descriptionForMessage = "";
			if (message.date.substring(0, 10) !== currentDay) {
				currentDay = message.date.substring(0, 10);
				descriptionForMessage += `\n\n__${currentDay}__`;
			}
			descriptionForMessage += `\n\`${message.date.substring(11)}\` <@${message.authorId}> : ${message.content}`;
			if (currentDescription.length + descriptionForMessage.length <= 2048) { // if the description would not be too long, add it
				currentDescription += descriptionForMessage;
			} else { // else start a new embed with a new description
				embedList.push({
					color: embedColorFromType["discussions"],
					description: currentDescription
				});
				currentDescription = descriptionForMessage;
			}
		}
	} else {
		currentDescription += mode === "moved french"
			? "\n\nDiscussion vide :mailbox_with_no_mail:"
			: "\n\nNo message :mailbox_with_no_mail:";
	}
	embedList.push({
		color: embedColorFromType["discussions"],
		description: currentDescription
	});
	embedList[0].title = mode === "moved french"
		? `__Messages déplacés depuis un autre salon__`
		: `__Details of discussion ${discussion.id}__`;
	return embedList;
};

const buildBadWordsLogEmbed = (message, badWords, warningMessage, infractionId) => {
	return {
		color: embedColorFromType["infractions"],
		title: `__Bad words (${infractionId})__`,
		description: `:face_with_symbols_over_mouth: User <@!${message.author.id}> sent bad word(s) in <#${message.channel.id}> [Jump to discussion](${warningMessage.url}).`,
		fields: [{
			name: "Original message",
			value: message.content
		},{
			name: "Bad word(s) :",
			value: "- " + badWords.join("\n- ")
		}],
		timestamp: new Date()
	};
};

const buildBadWordPrivateMessage = badWords => {
	return `:zipper_mouth: ${badWords.length === 1 ? "Le mot suivant est" : "Les mots suivants sont"}`
		+ ` dans la liste des mots censurés : ${badWords.join(", ")}`;
};

module.exports = {buildElementListEmbed, buildElementDetailsEmbed,
	buildDiscussionDetailsEmbeds,
	buildDiscussionMovedFrenchMessage, buildDiscussionMovedMessage,
	buildDiscussionPurgedOrSavedFrenchMessage, buildDiscussionPurgedOrSavedMessage,
	buildBadWordsLogEmbed, buildBadWordPrivateMessage};
