"use strict";

const {sendMessageToChannel, sendLog, deleteMessage} = require("./messages.js");
const {buildBadWordsLogEmbed} = require("./messageBuilder.js");
const {addInfoData, getAvailableId} = require("./dataManipulation.js");
const {getReadableDate} = require("./date.js");

const badWords = [
	"b(i|1)tt?es?",
	"teube?s?",
	"ch(i|1)bre?s?",
	"(c|k)ou(i|1)ll?es?",
	"(e|a)n(c|k)ul(é|e)s?",
	"(c|k)(o|0)nn?a(rd?|ss?e)s?",
	"p(é|e)tass?es?",
	"putt?(e|ain|1)s?",
	"sal(o|0)pe?s?",
	"br(a|e)nll?(é?e)s?"
];

const badWordsRegex = new RegExp("(^| |	)(" + badWords.join("|") + ")( |	|$)", "gi");

const handleBadWords = async message => {
	let badWords = containedBadWords(message);
	if (badWords !== null) {
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
		sendLog(buildBadWordsLogEmbed(message, badWords, warningMessage, infractionId), warningMessage);
	}
};

const handleBadWordsSoft = message => {
	let badWords = containedBadWords(message);
	if (badWords !== null) {
		sendMessageToChannel(message.channel,
			`${badWords.length === 1 ? "Le mot suivant est" : "Les mots suivants sont"} dans la liste des mots censurés : ${badWords.join(", ")}`);
	}
};

const containedBadWords = message => {
	return message.content.match(badWordsRegex);
};

module.exports = {handleBadWords, handleBadWordsSoft};
