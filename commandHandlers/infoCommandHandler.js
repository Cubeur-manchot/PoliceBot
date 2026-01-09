"use strict";

import CommandHandler from "./commandHandler.js";
import Command from "../command.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";

export default class InfoCommandHandler extends CommandHandler {
	static bansGetErrorMessage = "Une erreur s'est produite lors de la récupération des bannissements";
	static bansGetErrorMessage = "Une erreur s'est produite lors de la récupération des bannissements";
	static prisonsGetErrorMessage = "Une erreur s'est produite lors de la récupération des emprisonnements";
	constructor(commandManager) {
		super(
			commandManager,
			"info",
			{
				slash: true,
				user: true,
				message: false
			},
			"Affiche les informations d'un membre'",
			[
				{
					name: "member",
					description: "Membre à afficher",
					type: Command.optionTypes.user,
					required: true
				}
			]
		);
	};
	handleApplicationCommand = async interaction => {
		let member = interaction.isUserContextMenuCommand() ? interaction.targetMember : null; // if user context menu command, retrieve member and extract user
		let user = member?.user ?? this.parseCommandOptions(interaction.options).member; // if slash command, retrieve user directly
		let userId = user.id;
		let bans = this.orderByTimeDescending(await this.dataManager.getBans(userId, InfoCommandHandler.bansGetErrorMessage));
		let warnings = this.orderByTimeDescending(await this.dataManager.getWarnings(userId, InfoCommandHandler.warningsGetErrorMessage));
		let prisons = this.orderByTimeDescending(await this.dataManager.getPrisons(userId, InfoCommandHandler.prisonsGetErrorMessage));
		let userInfoEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.user,
			title: `Détails d'un membre`,
			thumbnailUrl: member?.displayAvatarURL() ?? user.displayAvatarURL(),
			description: `Voici les informations enregistrées pour <@${userId}> (@${user.username}).`,
			fields: [
				{name: `Bannissements (${bans.length})`, value: bans.length ? bans.map(this.getBanDetails).join("\n") : "(aucun bannissement)"},
				{name: `Avertissements (${warnings.length})`, value: warnings.length ? warnings.map(this.getWarningDetails).join("\n") : "(aucun avertissement)"},
				{name: `Emprisonnements (${prisons.length})`, value: prisons.length ? prisons.map(this.getPrisonDetails).join("\n") : "(aucun emprisonnement)"},
	getBanDetails = ban => `- ${this.formatDateShort(ban.startTime)} - ${ban.endTime ? this.formatDateShort(ban.endTime) : "(pas de date de fin)"} : ${ban.reason}`;
	getWarningDetails = warning => `- ${this.formatDateShort(warning.time)} : ${warning.reason}`;
	getPrisonDetails = prison => `- ${this.formatDateShort(prison.startTime)} - ${prison.endTime ? this.formatDateShort(prison.endTime) : "(pas de date de fin)"}`
	orderByTimeDescending = elements =>
		[...elements]
		.map(element => element.data)
		.sort(
			(firstElement, secondElement) => this.compareTimestamps(firstElement.startTime ?? firstElement.time, secondElement.startTime ?? secondElement.time)
		);
	compareTimestamps = (firstTimestamp, secondTimestamp) => (secondTimestamp.toMillis?.() ?? secondTimestamp) - (firstTimestamp.toMillis?.() ?? firstTimestamp);
};
