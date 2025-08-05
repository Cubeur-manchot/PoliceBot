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
			this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Aucun lien d'invitation n'a été trouvé."});
			return;
		}
		let serverInfo;
		try {
			serverInfo = await this.getServerInfo(inviteId);
		} catch {
			this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Une erreur s'est produite lors de la récupération des informations du serveur. Celui-ci n'a pas pu être ajouté à la whitelist."});
			return;
		}
		if (!serverInfo) {
			this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Aucune information n'est disponible pour ce serveur. Celui-ci n'a pas pu être ajouté à la whitelist."});
			return;
		}
		let whiteListedServer;
		try {
			whiteListedServer = await this.commandManager.bot.dataManager.getServerWhiteListById(serverInfo.id);
		} catch {
			this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Une erreur s'est produite lors de la récupération de la whitelist. Le serveur n'a pas pu être ajouté à celle-ci."});
			return;
		}
		if (!whiteListedServer) {
			try {
				await this.commandManager.bot.dataManager.addServerWhiteList(serverInfo);
				this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":white_check_mark: Ce serveur a été ajouté à la whitelist."});
			} catch {
				this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Une erreur s'est produite lors de l'ajout du serveur à la whitelist. Le serveur n'a pas pu être ajouté à celle-ci."});
			}
			return;
		}
		if (whiteListedServer.data.name !== serverInfo.name) {
			try {
				await this.commandManager.bot.dataManager.updateServerWhiteList(whiteListedServer.id, serverInfo);
				this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist avec un nom différent. Le nom du serveur a été mis à jour."});
			} catch {
				this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":x: Ce serveur est déjà présent dans la whitelist. Une erreur s'est produite lors de la mise à jour du nom du serveur dans la whitelist."});
			}
			return;
		}
		this.commandManager.bot.discordClientManager.replyInteraction(interaction, {content: ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist."});
	};
	getServerInfo = async invitationId => {
		let url = `https://discord.com/api/invites/${invitationId}`;
		let response;
		try {
			response = await fetch(
				`https://discord.com/api/invites/${invitationId}`,
				{
					headers: {
						"User-Agent": "PoliceBot (https://github.com/Cubeur-manchot/PoliceBot)",
						"Accept": "application/json"
					}
				}
			);
		} catch (fetchServerInfoError) {
			this.commandManager.bot.logger.error(`Error while fetching Discord API (${url}) : ${fetchServerInfoError}.`);
			throw fetchServerInfoError;
		}
		if (!response.ok) {
			this.commandManager.bot.logger.error(`HTTP error while fetching Discord API (${url}) : ${response.status}.`);
			return null;
		}
		try {
			let {guild} = await response.json();
			return guild ? {id: parseInt(guild.id), name: guild.name} : null;
		} catch (jsonError) {
			this.commandManager.bot.logger.error(`Error while getting JSON data from Discord API response (${url}) : ${jsonError}.`);
			return null;
		}
	};
};
