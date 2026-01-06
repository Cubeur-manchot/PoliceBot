"use strict";

import CommandHandler from "./commandHandler.js";
import Command from "../command.js";

export default class WarningCommandHandler extends CommandHandler {
	static warningModalShowErrorMessage = "Une erreur s'est produite lors de l'affichage de la modale de détails. L'avertissement n'a pas pu être enregistré";
	static warningAddErrorMessage = "Une erreur s'est produite lors de l'ajout de l'avertissement. Celui-ci n'a pas pu être enregistré";
	static warningAddSuccessMessage = ":white_check_mark: L'avertissement a été enregistré.";
	constructor(commandManager) {
		super(
			commandManager,
			"warning",
			{
				slash: true,
				user: true,
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
			],
			[
				{
					name: "userId",
					label: "Id de l'utilisateur",
					placeholder: null,
					isLong: false,
				},
				{
					name: "reason",
					label: "Motif",
					placeholder: "Spam, troll, vulgarités, ...",
					isLong: true
				}
			]
		);
	};
	handleApplicationCommand = async interaction => {
		if (interaction.isChatInputCommand()) { // slash command, contains all options
			let {member, reason} = this.parseCommandOptions(interaction.options);
			return await this.warnUser(member.id, reason);
		} else { // user context command, contains only the user
			let member = interaction.targetMember;
			let modalTitle = `Avertissement de ${member.displayName} (@${member.user.username})`;
			if (modalTitle.length > 45) {
				modalTitle = `${modalTitle.slice(0, 42)}...`;
			}
			let modalFields = this.command.modalFields;
			modalFields[0].initialValue = member.user.id;
			return this.buildDiscordModal(modalTitle, modalFields);
		}
	};
	handleModalSubmit = async interaction => {
		let {userId, reason} = this.parseModalTextFields(interaction.fields);
		return await this.warnUser(userId, reason);
	};
	warnUser = async (userId, reason) => {
		await this.dataManager.addWarning({userId, reason, time: new Date()}, WarningCommandHandler.warningAddErrorMessage);
		return WarningCommandHandler.warningAddSuccessMessage;
	};
};
