"use strict";

import CommandHandler from "./commandHandler.js";

export default class WhitelistCommandHandler extends CommandHandler {
	static noInvitationLinkFound = "Aucun lien d'invitation n'a été trouvé";
	static serverInfoGetErrorMessage = "Une erreur s'est produite lors de la récupération des informations du serveur. Celui-ci n'a pas pu être ajouté à la whitelist";
	static serverWhitelistGetErrorMessage = "Une erreur s'est produite lors de la récupération de la whitelist. Le serveur n'a pas pu être ajouté à celle-ci";
	static serverWhitelistAddErrorMessage = "Une erreur s'est produite lors de l'ajout du serveur à la whitelist. Le serveur n'a pas pu être ajouté à celle-ci";
	static serverWhitelistAddSuccessMessage = ":white_check_mark: Ce serveur a été ajouté à la whitelist.";
	static serverWhitelistUpdateErrorMessage = "Ce serveur est déjà présent dans la whitelist. Une erreur s'est produite lors de la mise à jour du nom du serveur dans la whitelist";
	static serverWhitelistUpdateSuccessMessage = ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist avec un nom différent. Le nom du serveur a été mis à jour.";
	static serverAlreadyInWhitelistInfoMessage = ":ballot_box_with_check: Ce serveur est déjà présent dans la whitelist.";
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
		let inviteId = this.getInvitationLink(interaction);
		let serverInfo = await this.dataManager.getServerInfo(inviteId, WhitelistCommandHandler.serverInfoGetErrorMessage);
		let whiteListedServer = await this.dataManager.getServerWhiteListById(serverInfo.id, WhitelistCommandHandler.serverWhitelistGetErrorMessage);
		if (!whiteListedServer) {
			await this.dataManager.addServerWhiteList(serverInfo, WhitelistCommandHandler.serverWhitelistAddErrorMessage);
			return {content: WhitelistCommandHandler.serverWhitelistAddSuccessMessage};
		}
		if (whiteListedServer.data.name !== serverInfo.name) {
			await this.dataManager.updateServerWhiteList(whiteListedServer.id, serverInfo, WhitelistCommandHandler.serverWhitelistUpdateErrorMessage);
			return {content: WhitelistCommandHandler.serverWhitelistUpdateSuccessMessage};
		}
		return {content: WhitelistCommandHandler.serverAlreadyInWhitelistInfoMessage};
	};
	getInvitationLink = interaction => {
		let inviteId =
			(interaction.isChatInputCommand()
				? Object.values(this.parseOptions(interaction.options))[0]
				: interaction.targetMessage.content)
			.match(new RegExp("(?<=https?:\/\/discord\.(?:gg|com\/invite)\/)[0-9a-z-]+", "i"))?.[0];
		if (inviteId) {
			return inviteId;
		} else {
			throw WhitelistCommandHandler.noInvitationLinkFound;
		}
	};
};
