"use strict";

const addInfractionHelpMessage = "```\n&addInfraction <member> <type> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<type>` : the type of infraction. Ex: HS, Bad words, ..."
	+ "\n`<commentary>` (optional) : gives more information about the infraction."
	+ "\n\nExample : ```\n&addInfraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

const addWarnHelpMessage = "```\n&warn <member> <reason> <infractionId> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<reason>` : the reason of the warn. Ex: HS répétitifs, Bad words, ..."
	+ "\n`<infractionId>` (optional) : the infraction(s) to be attached to the warn. Ex: i#1 i#3"
	+ "\n`<commentary>` (optional) : gives more information about the warn."
	+ "\n\nExample : ```\n&warn Cubeur-manchot#7706 HS répétitifs i#1 i#3 // c'est relou```";

const detailsHelpMessage = "```&details <elementId>```"
	+ "`<elementId>` : the id of the element you want details (infraction, warn or ban). Ex: i#1"
	+ "\n\nExample : ```\n&details i#1```";

const removeHelpMessage = "```\n&remove <elementId>```"
	+ "`<elementId>` is the id of the element (infraction, warn, ban) to remove/revoke."
	+ "\nIt can remove many elements at once."
	+ "\n\nExample: ```\n&remove i#3 i#4 w#1```";

module.exports = {addInfractionHelpMessage, addWarnHelpMessage, detailsHelpMessage, removeHelpMessage};
