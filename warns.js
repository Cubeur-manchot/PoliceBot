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
			embedObject.description += "`Id  ` `Date      ` `Reason        `";
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

module.exports = {buildEmbedWarnsList, warnHelpMessage};
