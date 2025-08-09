"use strict";

import CommandHandler from "./commandHandler.js";

export default class WhitelistCommandHandler extends CommandHandler {
	constructor(commandManager) {
		super(
			commandManager,
			"whitelist",
			{
				slash: true,
				user: false,
				message: true
			},
			"Ajoute un serveur à la whitelist",
			[
				{
					name: "lien",
					description: "Lien d'invitation complet",
					required: true
				}
			]
		);
	};
	handleCommand = async interaction => {
		let inviteId =
			(interaction.isChatInputCommand()
				? Object.values(this.parseOptions(interaction.options))[0]
				: interaction.targetMessage.content)
			.match(new RegExp(`(?<=https:\/\/discord\.gg\/)[0-9a-z]+`, "i"))?.[0];
		if (!inviteId) {
			return {content: ":x: Aucun lien d'invitation n'a été trouvé."};
		}
		let serverInfo;
		try {
			serverInfo = await this.commandManager.bot.dataManager.getServerInfo(inviteId);
		} catch {
			return {content: ":x: Une erreur s'est produite lors de la récupération des informations du serveur. Celui-ci n'a pas pu être ajouté à la whitelist."};
		}
		if (!serverInfo) {
			return {content: ":x: Aucune information n'est disponible pour ce serveur. Celui-ci n'a pas pu être ajouté à la whitelist."};
		}
		let whiteListedServer;
		try {
			whiteListedServer = await this.commandManager.bot.dataManager.getServerWhiteListById(serverInfo.id);
		} catch {
			return {content: ":x: Une erreur s'est produite lors de la récupération de la whitelist. Le serveur n'a pas pu être ajouté à celle-ci."};
		}
		if (!whiteListedServer) {
			try {
				await this.commandManager.bot.dataManager.addServerWhiteList(serverInfo);
				return {content: ":white_check_mark: Ce serveur a été ajouté à la whitelist."};
			} catch {
				return {content: ":x: Une erreur s'est produite lors de l'ajout du serveur à la whitelist. Le serveur n'a pas pu être ajouté à celle-ci."};
			}
		}
		if (whiteListedServer.data.name !== serverInfo.name) {
			try {
				await this.commandManager.bot.dataManager.updateServerWhiteList(whiteListedServer.id, serverInfo);
				return {content: ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist avec un nom différent. Le nom du serveur a été mis à jour."};
			} catch {
				return {content: ":x: Ce serveur est déjà présent dans la whitelist. Une erreur s'est produite lors de la mise à jour du nom du serveur dans la whitelist."};
			}
		}
		return {content: ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist."};
	};
};
