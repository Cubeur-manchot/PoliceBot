"use strict";

const {sendMessageToChannel, sendPrivateMessage, sendLog, deleteMessage} = require("./messages.js");
const {buildBadWordsLogEmbed, buildBadWordPrivateMessage} = require("./messageBuilder.js");
const {addInfoData, getAvailableId} = require("./dataManipulation.js");
const {getReadableDate} = require("./date.js");

const badWords = [
	{ word : "bite", regexString : "b(i|1)tt?es?" },
	{ word : "teub", regexString : "teube?s?" },
	{ word : "chibre", regexString : "ch(i|1)bre?s?" },
	{ word : "couille", regexString : "(c|k)ou(i|1)ll?es?" },
	{ word : "enculé", regexString : "(e|a)n(c|k)ul(é|e)s?" },
	{ word : "connard/connasse", regexString : "(c|k)(o|0)nn?a(rd?|ss?e)s?" },
	{ word : "pétasse", regexString : "p(é|e)tass?es?" },
	{ word : "pute", regexString : "putt?es?" },
	{ word : "salope", regexString : "sal(o|0)pe?s?" },
	{ word : "branle", regexString : "br(a|e)nll?((é?e?)s?|ett?e)" },
	{ word : "biffle", regexString : "b(i|1)ff?l(er?|é)e?s?" },
	{ word : "burne", regexString : "burnes?" },
	{ word : "faire foutre", regexString : "faire? f(o|0)utt?re?s?" }
];

const handleBadWords = async message => {
	let badWords = containedBadWords(message);
	if (badWords.length) {
		deleteMessage(message);
		let infractionId = getAvailableId("infractions");
		addInfoData({
			id: infractionId,
			memberId: message.author.id,
			date: getReadableDate(message.createdAt),
			type: "Bad word",
			commentary: badWords.join(", ")
		},"infractions");
		let warningMessage = await sendMessageToChannel(message.channel, "Oh c'est pas bien de dire ça ! :eyes:");
		sendLog(buildBadWordsLogEmbed(message, badWords, warningMessage, infractionId), message.client);
		sendPrivateMessage(message.author, buildBadWordPrivateMessage(badWords) + "\n\nMessage original :\n" + message.content);
	}
};

const handleBadWordsSoft = message => {
	let badWords = containedBadWords(message);
	if (badWords.length) {
		sendMessageToChannel(message.channel, buildBadWordPrivateMessage(badWords));
	}
};

const containedBadWords = message => {
	let detectedBadWords = [];
	for (let badWord of badWords) {
		if (new RegExp("(^| |	)" + badWord.regexString + "( |	|$)", "gi").test(message.content)) {
			detectedBadWords.push(badWord.word);
		}
	}
	return detectedBadWords;
};

module.exports = {handleBadWords, handleBadWordsSoft};
