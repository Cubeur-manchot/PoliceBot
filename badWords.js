"use strict";

const {sendMessageToChannel, sendLog, deleteMessage} = require("./messageHandler.js");
const {writeInfoData, getAvailableId, getReadableDate} = require("./dataManipulation.js");

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

const badWordsRegex = new RegExp("(^| |	)" + badWords.join("|") + "( |	|$)", "gi");

const handleBadWords = async message => {
	let badWords = containedBadWords(message);
	if (badWords !== null) {
		deleteMessage(message);
		writeInfoData({
			id: getAvailableId("infractions"),
			memberId: message.author.id,
			date: getReadableDate(message.createdAt),
			type: "Bad word",
			commentary: badWords.join(", ")
		},"infractions");
		let warningMessage = await sendMessageToChannel(message.channel, "Oh c'est pas bien de dire ça ! :eyes:");
		sendLog(buildBadWordsLogEmbed(message, badWords, warningMessage), warningMessage);
	}
};

const containedBadWords = message => {
	return message.content.match(badWordsRegex);
};

const buildBadWordsLogEmbed = (message, badWords, warningMessage) => {
	return {
		color: "#0099ff",
		title: "__Bad words__",
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

module.exports = {handleBadWords};
