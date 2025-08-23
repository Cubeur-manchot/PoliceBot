"use strict";

import CommandHandler from "./commandHandler.js";

export default class PrisonCommandHandler extends CommandHandler {
	static prisonerRoleAddErrorMessage = "Une erreur s'est produite. L'utilisateur n'a pas pu être envoyé en prison";
	static prisonerRoleAddSuccessMessage = ":white_check_mark: L'utilisateur a été envoyé en prison.";
	constructor(commandManager) {
		super(
			commandManager,
			"prison",
			{
				slash: false,
				user: true,
				message: false
			},
			"Envoie un membre en prison",
			[]
		);
	};
	handleCommand = async interaction => {
		await this.discordClientManager.addRoleToMember(interaction.targetMember, process.env.PRISONER_ROLE_ID, PrisonCommandHandler.prisonerRoleAddErrorMessage);
		return {content: PrisonCommandHandler.prisonerRoleAddSuccessMessage};
	};
};
