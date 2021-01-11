"use strict";

const addInfractionHelpMessage = "```\n&addInfraction <member> <type> // <commentary>```"
	+ "`<member>` : identifies the member. Ex: Cubeur-manchot#7706, Cubeur-manchot, 7706, 217709941081767937."
	+ "\n`<type>` : the type of infraction. Ex: HS, Bad words, ..."
	+ "\n`<commentary>` (optional) : gives more information about the infraction."
	+ "\n\nExample : ```\n&addInfraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

module.exports = {addInfractionHelpMessage};
