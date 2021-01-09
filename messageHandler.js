"use strict";

const {badWordsRegex} = require("./badWords.js");
const Discord = require("discord.js");

const containedBadWords = message => {
	return message.content.match(badWordsRegex);
};

const messageIsPoliceBotCommandMessage = message => {
	return message.content.startsWith("&");
};

const sendEmbedToChannel = (channel, embedObject) =>
	sendMessageToChannel(channel, new Discord.MessageEmbed(embedObject));

const sendMessageToChannel = (channel, message, options) =>
	channel.send(message, options)
		.catch(console.error);

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

const buildEmbedInfractionsList = infractions => {
	let embedObject = {
		color: "#cccc00",
		title: "__Infractions__",
	};
	if (infractions.length === 0) {
		embedObject.description = "No current infraction :innocent:";
	} else {
		embedObject.description = "Here is the list of all infractions :\n";
		embedObject.fields = [];
		let infractionsBuffer = [];
		for (let infraction of infractions) {
			if (infractionsBuffer[infraction.memberId]) { // member already has some infractions, simply add the new one
				infractionsBuffer[infraction.memberId].push(infraction);
			} else { // member has no infraction, create new array
				infractionsBuffer[infraction.memberId] = [infraction];
			}
		}
		for (let memberId in infractionsBuffer) {
			let memberInfractions = infractionsBuffer[memberId];
			embedObject.description += `\n<@${memberId}> (${memberInfractions.length}) :\n`;
			embedObject.description += "`Id  ` `Date      ` `Type          `\n";
			for (let infraction of memberInfractions) {
				embedObject.description += "`" + infraction.id + (infraction.id.length === 3 ? " " : "")
					+ "` `" + infraction.date.substring(0,10) + "` `";
				if (infraction.type.length > 14) {
					embedObject.description += infraction.type.substring(0,11) + "..."; // cut before end, and add "..."
				} else {
					embedObject.description += infraction.type + " ".repeat(14 - infraction.type.length); // complete with spaces at the end
				}
				embedObject.description += "`";
			}
		}
	}
	return embedObject;
};

const sendLog = (messageInformation, warningMessage) => {
	let logChannel = warningMessage.client.channels.cache.find(channel => {return channel.id === "795319669459648512"});
	if (messageInformation.title) { // embed message
		logChannel.send(new Discord.MessageEmbed(messageInformation))
			.catch(console.log);
	} else { // simple message
		logChannel.send(messageInformation)
			.catch(console.log);
	}
};

const deleteMessage = message => {
	if (message && !message.deleted) {
		message.delete()
			.catch(error => console.log(error));
	}
};

module.exports = {containedBadWords, messageIsPoliceBotCommandMessage, sendMessageToChannel, sendEmbedToChannel, buildBadWordsLogEmbed, buildEmbedInfractionsList, sendLog, deleteMessage};
