"use strict";

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

module.exports = {buildEmbedInfractionsList};
