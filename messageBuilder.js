"use strict";

const {groupElementsByMemberId} = require("./dataManipulation.js");

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

const buildEmbedInfractionsList = infractions => {
	let embedObject = {
		color: "#cccc00",
		title: "__Infractions__",
	};
	if (infractions.length === 0) {
		embedObject.description = "No current infraction :innocent:";
	} else {
		embedObject.description = "Here is the list of all infractions :\n";
		let infractionsBuffer = groupElementsByMemberId(infractions);
		for (let memberId in infractionsBuffer) {
			let memberInfractions = infractionsBuffer[memberId];
			embedObject.description += `\n<@${memberId}> (${memberInfractions.length}) :\n`;
			embedObject.description += "`Id  ` `Date      ` `Type          `";
			for (let infraction of memberInfractions) {
				embedObject.description += "\n`" + infraction.id + (infraction.id.length === 3 ? " " : "")
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

module.exports = {addInfractionHelpMessage, addWarnHelpMessage, buildEmbedInfractionsList};
