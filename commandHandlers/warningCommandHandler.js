"use strict";

import CommandHandler from "./commandHandler.js";
import Command from "../command.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";

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
					type: Command.optionTypes.string,
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
			return await this.warnMember(member, member.id, reason);
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
		let member = interaction.guild.members.cache.get(userId);
		return await this.warnMember(member, userId, reason);
	};
	warnMember = async (member, userId, reason) => {
		let warning = {userId, reason, time: new Date()};
		await this.dataManager.addWarning(warning, WarningCommandHandler.warningAddErrorMessage);
		this.sendWarningEmbedPoliceLog(warning, member);
		return WarningCommandHandler.warningAddSuccessMessage;
	};
	sendWarningEmbedPoliceLog = async (warning, member) => {
		let warningEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.warning,
			title: "Un membre a reçu un avertissement",
			thumbnailUrl: member?.displayAvatarURL() ?? member?.user.displayAvatarURL(),
			description: `<@${warning.userId}>${member.user ? ` (@${member.user.username})` : ""} a reçu un avertissement.`,
			fields: [
				{name: "Date", value: this.formatDate(warning.time), inline: true},
				{name: "Motif", value: warning.reason, inline: true}
			]
		});
		this.discordActionManager.sendPoliceLogMessage({
			embeds: [warningEmbed.embed]
		});
	};
};
