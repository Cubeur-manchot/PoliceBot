"use strict";

const {groupElementsByMemberId, readInfoData, infoTypeFromIdFirstLetter} = require("./dataManipulation.js");
const {parseDate, getReadableDiffDate, addHours} = require("./date.js");

const embedColorFromType = {
	"infractions": "#cccc00",
	"warns": "#d56600",
	"bans": "#fc0000",
	"discussions": "#666666",
	"nicknameChange": "#1111ff",
	"messageChange": "#550055",
	"messageDelete": "#3300aa"
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

const buildElementDetailsEmbed = (element, timezoneOffset) => {
	let infoType = infoTypeFromIdFirstLetter[element.id[0]];
	let description = `**Membre** : <@${element.memberId}>`; // member
	let diffDate = getReadableDiffDate(addHours(new Date(), timezoneOffset), parseDate(element.date));
	description += `\n**Date** : ${element.date} `;
	if (diffDate === "égal") {
		description += "(à l'instant)";
	} else {
		description += `(il y a ${diffDate})`;
	}
	if (infoType === "infractions") {
		description += `\n**Type** : ${element.type}`; // infraction type
	} else {
		if (infoType === "bans") {
			description += "\n**Date d'expiration** : "; // expiration date
			if (element.expirationDate === "") {
				description += "Aucune (ban définitif)";
			} else {
				let currentDate = addHours(new Date(), timezoneOffset);
				let expirationDate = parseDate(element.expirationDate);
				description += element.expirationDate;
				if (currentDate < expirationDate) {
					let banExpirationDiffDate = getReadableDiffDate(expirationDate, currentDate);
					if (banExpirationDiffDate === "égal") {
						description += " (à l'instant)";
					} else {
						description += ` (reste ${banExpirationDiffDate})`;
					}
				} else {
					let banExpiredDiffDate = getReadableDiffDate(currentDate, expirationDate);
					if (banExpiredDiffDate === "égal") {
						description += " (à l'instant)";
					} else {
						description += ` (terminé il y a ${banExpiredDiffDate})`;
					}
				}
			}
		}
		description += `\n**Raison** : ${element.reason}`; // warn or ban reason
	}
	description += `\n**Commentaire** : ${element.commentary === "" ? "aucun" : element.commentary}`;
	return {
		color: embedColorFromType[infoType], // color
		title: `__Détails ${infoType === "infractions" ? "de l'" : "du "}${infoType.slice(0, -1)} ${element.id}__`, // id
		description: description // description
	};
};

const buildDiscussionPurgedOrSavedOrMovedFrenchMessage = (nbMessages, purgeOrSaveOrMove, destinationChannelId) => {
	return `${nbMessages} message${nbMessages > 1 ? "s ont" : " a"} été `
		+ `${purgeOrSaveOrMove === "purge" ? "supprimé" : purgeOrSaveOrMove === "save" ? "sauvegardé" : "déplacé"}${nbMessages > 1 ? "s" : ""}`
		+ (purgeOrSaveOrMove === "move" ? ` vers <#${destinationChannelId}>` : "");
};

const buildDiscussionPurgedOrSavedOrMovedMessage = (nbMessages, purgeOrSaveOrMove, discussionId, originChannelId, destinationChannelId) => {
	return `${nbMessages} message${nbMessages > 1 ? "s were" : " was"} ${purgeOrSaveOrMove}d `
		+ (purgeOrSaveOrMove === "move" ? `from <#${originChannelId}> to <#${destinationChannelId}>` : `in channel <#${originChannelId}>`)
		+ ` (${discussionId})`;
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
		description: `:face_with_symbols_over_mouth: User <@!${message.author.id}> sent bad word(s) in <#${message.channel.id}>. [Jump to discussion](${warningMessage.url})`,
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

const buildInviteLinkLogEmbed = (message, invitationsNotInWhiteListStringified, warningMessage, infractionId) => {
	return {
		color: embedColorFromType["infractions"],
		title: `__Invitation link (${infractionId})__`,
		description: `:rage: User <@!${message.author.id}> sent unauthorized invitation(s) in <#${message.channel.id}> [Jump to discussion](${warningMessage.url}).`,
		fields: [{
			name: "Original message",
			value: message.content
		}, {
			name: "Unauthorized invitation(s) :",
			value: "- " + invitationsNotInWhiteListStringified.join("\n- ")
		}],
		timestamp: new Date()
	};
};

const buildInviteLinkPrivateMessage = invitationsNotInWhiteListStringified => {
	return `:face_with_spiral_eyes: ${invitationsNotInWhiteListStringified.length === 1
		? "Cette invitation n'est pas autorisée" : "Ces invitations ne sont pas autorisées"} sur le serveur : `
		+ invitationsNotInWhiteListStringified.join(", ");
};

const buildMemberInfractionFrenchMessage = (memberId, infractionId, type) => {
	return `<@!${memberId}> a commis une infraction (${infractionId}).\nType : ${type}`;
};

const buildMemberInfractionMessage = (memberId, infractionId, type) => {
	return `<@!${memberId}> has commited an infraction (${infractionId}).\nType : ${type}`;
};

const buildMemberWarnedFrenchMessage = (memberId, warnId, reason) => {
	return `<@!${memberId}> a reçu un avertissement (${warnId}).\nMotif : ${reason}`;
};

const buildMemberWarnedMessage = (memberId, warnId, reason) => {
	return `<@!${memberId}> has been warned (${warnId}).\nReason : ${reason}`;
};

const buildMemberBannedFrenchMessage = (memberId, banId, reason) => {
	return `<@!${memberId}> a été banni (${banId}).\nMotif : ${reason}`;
};

const buildMemberUnbannedFrenchMessage = (memberId, banId) => {
	return `<@!${memberId}> a été débanni (${banId}).`;
};

const buildMemberBanOrUnbanLogEmbed = (userId, avatarUrl, banId, banOrUnban) => {
	return {
		color: embedColorFromType["bans"],
		title: `__Member ${banOrUnban}ned__`,
		description: `${banOrUnban === "ban" ? ":smiling_imp:" : ":eyes:"} User <@!${userId}> was ${banOrUnban}ned${banId ? ` (${banId})` : ""}.`,
		thumbnail: {
			url: avatarUrl
		},
		timestamp: new Date()
	}
};

const buildNicknameChangeLogEmbed = (oldMemberPseudo, oldMemberTag, userId, userAvatarUrl, nicknameOrUsername) => {
	return {
		color: embedColorFromType["nicknameChange"],
		title: `__${nicknameOrUsername} changed__`,
		description: `${oldMemberPseudo} (${oldMemberTag}) is now <@!${userId}>.`,
		thumbnail: {
			url: userAvatarUrl
		},
		timestamp: new Date()
	};
};

const buildAvatarChangeLogEmbed = (userId, oldAvatarUrl, newAvatarUrl) => {
	return {
		color: embedColorFromType["avatarChange"],
		title: "__Avatar changed__",
		description: `<@!${userId}>'s avatar was : \n\n\nIt's now :`,
		thumbnail: {
			url: oldAvatarUrl
		},
		image: {
			url: newAvatarUrl
		},
		timestamp: new Date()
	}
};

const buildMessageChangeLogEmbeds = (oldMessageContent, newMessageContent, userId, messageUrl, channelId, avatarUrl) => {
	let descriptionBegin = `Message send by <@!${userId}> in <#${channelId}> was edited. [Jump to discussion](${messageUrl})`;
	let descriptionOldMessage = `\n\n**Old message** :\n${oldMessageContent}`;
	let descriptionNewMessage = `\n\n**New message** :\n${newMessageContent}`;
	let fullDescription = descriptionBegin + descriptionOldMessage + descriptionNewMessage;
	if (fullDescription.length <= 4096) { // all fits in one single embed
		return [{
			color: embedColorFromType["messageChange"],
			title: "__Message edited__",
			description: fullDescription,
			thumbnail: {
				url: avatarUrl
			},
			timestamp: new Date()
		}];
	} else { // have to split into two separate embeds
		return [{
			color: embedColorFromType["messageChange"],
			title: "__Message edited__",
			description: descriptionBegin + descriptionOldMessage,
			thumbnail: {
				url: avatarUrl
			}
		}, {
			color: embedColorFromType["messageChange"],
			description: descriptionNewMessage.substring(2), // remove the two newlines
			timestamp: new Date()
		}];
	}
};

const buildMessageDeleteLogEmbed = (messageContent, userId, channelId, avatarUrl, imageUrl) => {
	return {
		color: embedColorFromType["messageDelete"],
		title: "__Message deleted__",
		description: `Message sent by <@!${userId}> in <#${channelId}> was deleted.\n\n**Original message** :\n${messageContent}`
			+ (imageUrl ? "\n\n**Image** :" : ""),
		thumbnail: {
			url: avatarUrl
		},
		image: {
			url: imageUrl
		},
		timestamp: new Date()
	};
};

module.exports = {buildElementListEmbed, buildElementDetailsEmbed,
	buildDiscussionDetailsEmbeds,
	buildDiscussionPurgedOrSavedOrMovedFrenchMessage, buildDiscussionPurgedOrSavedOrMovedMessage,
	buildBadWordsLogEmbed, buildBadWordPrivateMessage,
	buildInviteLinkLogEmbed, buildInviteLinkPrivateMessage,
	buildMemberInfractionFrenchMessage, buildMemberInfractionMessage,
	buildMemberWarnedFrenchMessage, buildMemberWarnedMessage,
	buildMemberBannedFrenchMessage, buildMemberUnbannedFrenchMessage, buildMemberBanOrUnbanLogEmbed,
	buildNicknameChangeLogEmbed, buildAvatarChangeLogEmbed,
	buildMessageChangeLogEmbeds, buildMessageDeleteLogEmbed
};
