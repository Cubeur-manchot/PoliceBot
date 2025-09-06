"use strict";

import CommandHandler from "./commandHandler.js";
import Command from "../command.js";

export default class WarningCommandHandler extends CommandHandler {
	static warningAddErrorMessage = "Une erreur s'est produite lors de l'ajout de l'avertissement. Celui-ci n'a pas pu être enregistré";
	static warningAddSuccessMessage = ":white_check_mark: L'avertissement a été enregistré.";
	constructor(commandManager) {
		super(
			commandManager,
			"warning",
			{
				slash: true,
				user: false,
				message: false
			},
			"Déclare un avertissement concernant un membre",
			[
				{
					name: "member",
					description: "Membre concerné",
					type: Command.optionTypes.user,
					required: true
				},
				{
					name: "reason",
					description: "Motif de l'avertissement",
					required: true
				}
			]
		);
	};
	handleApplicationCommand = async interaction => {
			let {member, reason} = this.parseCommandOptions(interaction.options);
			return await this.warnUser(member.id, reason);
	warnUser = async (userId, reason) => {
		await this.dataManager.addWarning({userId, reason, time: new Date()}, WarningCommandHandler.warningAddErrorMessage);
		return WarningCommandHandler.warningAddSuccessMessage;
	};
};
