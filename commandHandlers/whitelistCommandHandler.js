"use strict";

import Command from "../command.js";
import CommandHandler from "./commandHandler.js";

export default class WhitelistCommandHandler extends CommandHandler {
	static noInvitationLinkFound = "Aucun lien d'invitation n'a été trouvé";
	static serverInfoGetErrorMessage = "Une erreur s'est produite lors de la récupération des informations du serveur et de la whitelist. Le serveur n'a pas pu être ajouté à la whitelist";
	static serverWhitelistAddErrorMessage = "Une erreur s'est produite lors de l'ajout du serveur à la whitelist. Le serveur n'a pas pu être ajouté à celle-ci";
	static serverWhitelistAddSuccessMessage = ":white_check_mark: Ce serveur a été ajouté à la whitelist.";
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
					name: "link",
					description: "Lien d'invitation complet",
					type: Command.optionTypes.string,
					required: true
				}
			]
		);
	};
	handleApplicationCommand = async interaction => {
		let inviteId = this.getInvitationLink(interaction);
		let serverInfo = (await this.dataManager.getServerInfo(inviteId, WhitelistCommandHandler.serverInfoGetErrorMessage)).data;
		if (serverInfo.isWhitelisted) {
			return WhitelistCommandHandler.serverAlreadyInWhitelistInfoMessage;
		}
		delete serverInfo.isWhitelisted;
		await this.dataManager.addServerWhitelist(serverInfo, inviteId, WhitelistCommandHandler.serverWhitelistAddErrorMessage);
		return WhitelistCommandHandler.serverWhitelistAddSuccessMessage;
	};
	getInvitationLink = interaction => {
		let inviteId =
			(interaction.isChatInputCommand()
				? this.parseCommandOptions(interaction.options).link
				: interaction.targetMessage.content)
			.match(new RegExp("(?<=https?:\/\/discord\.(?:gg|com\/invite)\/)[0-9a-z-]+", "i"))?.[0];
		if (inviteId) {
			return inviteId;
		} else {
			throw WhitelistCommandHandler.noInvitationLinkFound;
		}
	};
};
