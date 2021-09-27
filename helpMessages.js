"use strict";

// main help message

const mainHelpMessage = "Here is the list of commands I support. "
	+ "To get specific help for one of them, simply type the command without any argument."
	+ "\n`&help` : display this help."
	+ "\n`&save` : saves some messages."
	+ "\n`&purge` : delete some messages."
	+ "\n`&move` : move some messages to another channel."
	+ "\n`&discussions` : display the list of all saved discussions."
	+ "\n`&infraction`/`&addInfraction` : add an infraction to a member."
	+ "\n`&infractions` : display the list of all infractions."
	+ "\n`&warn`/`&addWarn` : add a warn to a member."
	+ "\n`&infractions` : display the list of all warns."
	+ "\n`&ban`/`&addBan` : ban a member."
	+ "\n`&unban` : unban a member."
	+ "\n`&bans` : display the list of all bans."
	+ "\n`&details` : display the detailed information of an infractions, a warn or a ban."
	+ "\n`&remove` : remove an infractions, a warn or a ban.";

// help messages for discussion commands

const buildPurgeSaveMoveHelpMessage = purgeOrSaveOrMove => {
	let helpMessage = "```";
	for (let argument of ["<nbMessages>", "<hours>:<minutes>", "<day>/<month>"]) {
		helpMessage += `\n&${purgeOrSaveOrMove} ${argument}${purgeOrSaveOrMove === "move" ? " #bots_poubelle" : ""}`;
	}
	helpMessage += "```";
	helpMessage += "\n`<nbMessages>` : the number of messages to " + purgeOrSaveOrMove + "."
		+ "\n`<hour>:<minute>` : the time from which messages must be " + purgeOrSaveOrMove + "d."
		+ "\n`<day>/<month>` : the day from which messages must be " + purgeOrSaveOrMove + "d.";
	if (purgeOrSaveOrMove === "move") {
		helpMessage += "\n`<channel>` : the channel in which the messages should be moved.";
	}
	helpMessage += "\n\nExamples : ```";
	for (let argument of ["42", "23:58", "19/06"]) {
		helpMessage += `\n&${purgeOrSaveOrMove} ${argument}${purgeOrSaveOrMove === "move" ? " #bots_poubelle" : ""}`;
	}
	helpMessage += "```";
	if (purgeOrSaveOrMove === "save") {
		helpMessage += "\nThe command message will be deleted.";
	}
	return helpMessage;
};

const purgeHelpMessage = buildPurgeSaveMoveHelpMessage("purge");
const saveHelpMessage = buildPurgeSaveMoveHelpMessage("save");
const moveHelpMessage = buildPurgeSaveMoveHelpMessage("move");

// help messages for infractions, warns and bans commands

const addInfractionHelpMessage = "```\n&infraction <membre> <type> // <commentaire>```"
	+ "`<membre>` : identifie le membre. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<type>` : type d'infraction. Ex: HS, Bad words, ..."
	+ "\n`<commentaire>` (optionnel) : donne des informations complémentaires."
	+ "\n\nExemple : ```\n&infraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

const addWarnHelpMessage = "```\n&warn <membre> <raison> // <commentaire>```"
	+ "`<membre>` : identifie le membre. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<raison>` : la raison du warn. Ex: HS répétitifs, Non respect d'un membre, ..."
	+ "\n`<commentaire>` (optionnel) : donne des informations complémentaires."
	+ "\n\nExemple : ```\n&warn Cubeur-manchot#7706 HS répétitifs // impertinent```";

const addBanHelpMessage = "```\n&ban <membre> <raison> <date d'expiration> // <commentaire>```"
	+ "`<membre>` : identifie le membre. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<raison>` : la raison du ban. Ex: 3 warns."
	+ "\n`<date d'expiration>` (optionnel) : date à laquelle le ban sera révoqué. Si non spécifié, le ban est définitif. Ex: 18/04/2021."
	+ "\n`<commentaire>` (optionnel) : donne des informations complémentaires."
	+ "\n\nExemple ```\n&ban Cubeur-manchot#7706 3 warns 18/04/2021 // ça dégage```";

const unbanHelpMessage = "```\n&unban <membre>```"
	+ "`<membre>` : identifie le membre. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n\nExemple ```\n&unban Cubeur-manchot#7706```";

// help messages for general commands

const detailsHelpMessage = "```&details <elementId>```"
	+ "`<elementId>` : the id of the element you want details (infraction, warn, ban or saved discussion). Ex: i#1."
	+ "\nIt can show many elements at once."
	+ "\n\nExample : ```\n&details i#1 i#4 w#1```";

const removeHelpMessage = "```\n&remove <elementId>```"
	+ "`<elementId>` is the id of the element (infraction, warn, ban or saved discussion) to remove/revoke."
	+ "\nIt can remove many elements at once."
	+ "\n\nExample: ```\n&remove i#3 i#4 w#1```";

module.exports = {mainHelpMessage,
	saveHelpMessage, purgeHelpMessage, moveHelpMessage,
	addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, unbanHelpMessage,
	detailsHelpMessage, removeHelpMessage};
