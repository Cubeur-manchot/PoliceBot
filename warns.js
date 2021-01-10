"use strict";

const {groupElementsByMemberId} = require("./dataManipulation.js");

const buildEmbedWarnsList = warns => {
	let embedObject = {
		color: "#cccc00",
		title: "__Warns__",
	};
	if (warns.length === 0) {
		embedObject.description = "No current warn :thumbsup:";
	} else {
		embedObject.description = "Here is the list of all warns :\n";
		let warnsBuffer = groupElementsByMemberId(warns);
		for (let memberId in warnsBuffer) {
			let memberWarns = warnsBuffer[memberId];
			embedObject.description += `\n<@${memberId}> (${memberWarns.length}) :\n`;
			embedObject.description += "`Id  ` `Date      ` `Type          `";
			for (let warn of memberWarns) {
				embedObject.description += "\n`" + warn.id + (warn.id.length === 3 ? " " : "")
					+ "` `" + warn.date.substring(0,10) + "` `";
				if (warn.reason.length > 14) {
					embedObject.description += warn.reason.substring(0,11) + "..."; // cut before end, and add "..."
				} else {
					embedObject.description += warn.reason + " ".repeat(14 - warn.reason.length); // complete with spaces at the end
				}
				embedObject.description += "`";
			}
		}
	}
	return embedObject;
};

const warnHelpMessage = "```\n&addWarn <member> <reason> <infractionId> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<reason>` : the reason of the warn. Ex: HS répétitifs, Bad words, ..."
	+ "\n`<infractionId>` (optional) : the infraction(s) to be attached to the warn. Ex: i#1 i#3"
	+ "\n`<commentary>` (optional) : gives more information about the warn."
	+ "\n\nExample : ```\n&addWarn Cubeur-manchot#7706 HS répétitifs i#1 i#3 // c'est relou```";

module.exports = {buildEmbedWarnsList, warnHelpMessage};
