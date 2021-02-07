"use strict";

// help messages for discussion commands

const saveHelpMessage = "```&save <nbMessages>```"
	+ "`<nbMessages>` : the number of messages to save."
	+ "\nThe command message will be deleted."
	+ "\n\nExample : ```\n&save 42```";

const purgeHelpMessage = "```&purge <nbMessages>```"
	+ "`<nbMessages>` : the number of messages to purge."
	+ "\n\nExample : ```\n&purge 42```";

const moveHelpMessage = "```&move <nbMessages> <channel>```"
	+ "`<nbMessages>` : the number of messages to move."
	+ "\n`<channel>` : the channel in which the messages should be moved."
	+ "\n\nExample : ```\n&move 42 #bots_poubelle```";

// help messages for infractions, warns and bans commands

const addInfractionHelpMessage = "```\n&addInfraction <member> <type> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<type>` : the type of infraction. Ex: HS, Bad words, ..."
	+ "\n`<commentary>` (optional) : gives more information about the infraction."
	+ "\n\nExample : ```\n&addInfraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

const addWarnHelpMessage = "```\n&warn <member> <reason> <infractionsId> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<reason>` : the reason of the warn. Ex: HS répétitifs, Bad words, ..."
	+ "\n`<infractionsId>` (optional) : the infraction(s) to be attached to the warn. Ex: i#1 i#3."
	+ "\n`<commentary>` (optional) : gives more information about the warn."
	+ "\n\nExample : ```\n&warn Cubeur-manchot#7706 HS répétitifs i#1 i#3 // c'est relou```";

const addBanHelpMessage = "```\n&ban <member> <reason> <expirationDate> <warnsId> // commentary```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937."
	+ "\n`<reason>` : the reason of the ban. Ex: 3 warns."
	+ "\n`<expirationDate>` (optional) : the date when the ban will be revoked. If not specified, the ban is definitive. Ex: 18/04/2021."
	+ "\n`<warnsId>` (optional) : the warn(s) to be attached to the ban. Ex: w#1 w#3."
	+ "\n`<commentary>` (optional) : gives more information about the warn."
	+ "\n\nExample: ```\n&ban Cubeur-manchot#7706 3 warns 18/04/2021 w#1 w#3 w#4 // c'est relou```";

const unbanHelpMessage = "```\n&unban <member>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937.";

// help messages for general commands

const detailsHelpMessage = "```&details <elementId>```"
	+ "`<elementId>` : the id of the element you want details (infraction, warn, ban or saved discussion). Ex: i#1."
	+ "\nIt can show many elements at once."
	+ "\n\nExample : ```\n&details i#1 i#4 w#1```";

const removeHelpMessage = "```\n&remove <elementId>```"
	+ "`<elementId>` is the id of the element (infraction, warn, ban or saved discussion) to remove/revoke."
	+ "\nIt can remove many elements at once."
	+ "\n\nExample: ```\n&remove i#3 i#4 w#1```";

module.exports = {saveHelpMessage, purgeHelpMessage, moveHelpMessage,
	addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, unbanHelpMessage,
	detailsHelpMessage, removeHelpMessage};
