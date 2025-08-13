"use strict";

import CommandHandler from "./commandHandler.js";

export default class PrisonCommandHandler extends CommandHandler {
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
		try {
			await this.commandManager.bot.discordClientManager.addRoleToMember(interaction.targetMember, process.env.PRISONER_ROLE_ID);
			return {content: ":white_check_mark: L'utilisateur a été envoyé en prison."};
		} catch {
			return {content: ":x: Une erreur s'est produite. L'utilisateur n'a pas pu être envoyé en prison."};
		}
	};
};
