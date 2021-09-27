"use strict";

// main help message

const mainHelpMessage = "Voici la liste des commandes supportées. "
	+ "Pour avoir l'aide spécifique d'une commande, envoyer la commande sans aucun argument."
	+ "\n`&help` : affiche cette aide."
	+ "\n`&save` : sauvegarde des messages."
	+ "\n`&purge` : supprime des messages."
	+ "\n`&move` : déplace des messages dans un autre channel."
	+ "\n`&discussions` : affiche toutes les discussions sauvegardées."
	+ "\n`&infraction`/`&addInfraction` : ajoute une infraction à un membre."
	+ "\n`&infractions` : affiche toutes les infractions."
	+ "\n`&warn`/`&addWarn` : ajoute un warn à un membre."
	+ "\n`&infractions` : affiche tous les warns."
	+ "\n`&ban`/`&addBan` : bannit un membre."
	+ "\n`&unban` : débannit un membre."
	+ "\n`&bans` : affiche tous les bans."
	+ "\n`&details` : affiche les détails d'une infraction, un warn ou un ban."
	+ "\n`&remove` : supprime une infraction, un warn ou un ban.";

// help messages for discussion commands

const buildPurgeSaveMoveHelpMessage = purgeOrSaveOrMove => {
	let purgeOrSaveOrMoveInFrench =	purgeOrSaveOrMove === "purge" ? "supprimer" :
		purgeOrSaveOrMove === "save" ? "sauvegarder" : "déplacer";
	let helpMessage = "```";
	for (let argument of ["<nbMessages>", "<hours>:<minutes>", "<day>/<month>"]) {
		helpMessage += `\n&${purgeOrSaveOrMove} ${argument}${purgeOrSaveOrMove === "move" ? " #bots_poubelle" : ""}`;
	}
	helpMessage += "```";
	helpMessage += "\n`<nbMessages>` : le nombre de messages à " + purgeOrSaveOrMoveInFrench + "."
		+ "\n`<hour>:<minute>` : le moment à partir duquel " + purgeOrSaveOrMoveInFrench + " les messages."
		+ "\n`<day>/<month>` : le jour à partir duquel " + purgeOrSaveOrMoveInFrench + " les messages.";
	if (purgeOrSaveOrMove === "move") {
		helpMessage += "\n`<channel>` : the channel dans lequel les messages doivent être déplacés.";
	}
	helpMessage += "\n\nExemples : ```";
	for (let argument of ["42", "23:58", "19/06"]) {
		helpMessage += `\n&${purgeOrSaveOrMove} ${argument}${purgeOrSaveOrMove === "move" ? " #bots_poubelle" : ""}`;
	}
	helpMessage += "```";
	if (purgeOrSaveOrMove === "save") {
		helpMessage += "\nLe message de commande sera supprimé.";
	}
	return helpMessage;
};

const purgeHelpMessage = buildPurgeSaveMoveHelpMessage("purge");
const saveHelpMessage = buildPurgeSaveMoveHelpMessage("save");
const moveHelpMessage = buildPurgeSaveMoveHelpMessage("move");

// help messages for infractions, warns and bans commands

let memberHelpMessageChunk = "`<membre>` : identifie le membre. Ex: Cubeur-manchot#7706, Cubeur-manchot, 217709941081767937.";
let commentaryHelpMessageChunk = "\n`<commentaire>` (optionnel) : donne des informations complémentaires.";

const addInfractionHelpMessage = "```\n&infraction <membre> <type> // <commentaire>```"
	+ memberHelpMessageChunk
	+ "\n`<type>` : type d'infraction. Ex: HS, Bad words, ..."
	+ commentaryHelpMessageChunk
	+ "\n\nExemple : ```\n&infraction Cubeur-manchot#7706 HS répétitifs // c'est relou```";

const addWarnHelpMessage = "```\n&warn <membre> <raison> // <commentaire>```"
	+ memberHelpMessageChunk
	+ "\n`<raison>` : la raison du warn. Ex: HS répétitifs, Non respect d'un membre, ..."
	+ commentaryHelpMessageChunk
	+ "\n\nExemple : ```\n&warn Cubeur-manchot#7706 Non respect d'un membre // impertinent```";

const addBanHelpMessage = "```\n&ban <membre> <raison> <date d'expiration> // <commentaire>```"
	+ memberHelpMessageChunk
	+ "\n`<raison>` : la raison du ban. Ex: 3 warns."
	+ "\n`<date d'expiration>` (optionnel) : date à laquelle le ban sera révoqué. Si non spécifié, le ban est définitif. Ex: 18/04/2021."
	+ commentaryHelpMessageChunk
	+ "\n\nExemple ```\n&ban Cubeur-manchot#7706 3 warns 18/04/2021 // ça dégage```";

const unbanHelpMessage = "```\n&unban <membre>```"
	+ memberHelpMessageChunk
	+ "\n\nExemple ```\n&unban Cubeur-manchot#7706```";

// help messages for general commands

const detailsHelpMessage = "```&details <elementId>```"
	+ "`<elementId>` : les id des éléments pour lequels on veut des détails (infraction, warn, ban ou discussion). Ex: i#1."
	+ "\n\nExemple : ```\n&details i#3 i#4 w#1```";

const removeHelpMessage = "```\n&remove <elementId>```"
	+ "`<elementId>` : les id des éléments à supprimer (infraction, warn, ban ou discussion). Ex: i#1."
	+ "\n\nExemple: ```\n&remove i#3 i#4 w#1```";

module.exports = {mainHelpMessage,
	saveHelpMessage, purgeHelpMessage, moveHelpMessage,
	addInfractionHelpMessage, addWarnHelpMessage, addBanHelpMessage, unbanHelpMessage,
	detailsHelpMessage, removeHelpMessage};
