"use strict";

import CommandHandler from "./commandHandler.js";
import Command from "../command.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";

export default class InfoCommandHandler extends CommandHandler {
	static bansGetErrorMessage = "Une erreur s'est produite lors de la récupération des bannissements";
	static bansGetErrorMessage = "Une erreur s'est produite lors de la récupération des bannissements";
	static prisonsGetErrorMessage = "Une erreur s'est produite lors de la récupération des emprisonnements";
	static infractionsGetErrorMessage = "Une erreur s'est produite lors de la récupération des infractions";
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
		let member = interaction.isUserContextMenuCommand() ? interaction.targetMember : this.parseCommandOptions(interaction.options).member;
		let user = member.user;
		let userId = user.id;
		let bans = this.orderByTimeDescending(await this.dataManager.getBans(userId, InfoCommandHandler.bansGetErrorMessage));
		let warnings = this.orderByTimeDescending(await this.dataManager.getWarnings(userId, InfoCommandHandler.warningsGetErrorMessage));
		let prisons = this.orderByTimeDescending(await this.dataManager.getPrisons(userId, InfoCommandHandler.prisonsGetErrorMessage));
		let infractionsMap = this.groupBy((await this.dataManager.getInfractions(userId, InfoCommandHandler.infractionsGetErrorMessage)).map(infraction => infraction.data), "type");
		let offTopics = infractionsMap.get("Off-topic") ?? [];
		let forbiddenInvites = infractionsMap.get("Forbidden invite") ?? [];
		let userInfoEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.user,
			title: `Détails d'un membre`,
			thumbnailUrl: member?.displayAvatarURL() ?? user.displayAvatarURL(),
			description: `Voici les informations enregistrées pour <@${userId}> (@${user.username}).`,
			fields: [
				{name: "Arrivée sur Discord", value: this.formatDateShort(user.createdTimestamp), inline: true},
				{name: "Arrivée sur le serveur", value: member ? this.formatDateShort(member.joinedTimestamp) : "(impossible à déterminer)", inline: true},
				{name: `Bannissements (${bans.length})`, value: bans.length ? bans.map(this.getBanDetails).join("\n") : "(aucun bannissement)"},
				{name: `Avertissements (${warnings.length})`, value: warnings.length ? warnings.map(this.getWarningDetails).join("\n") : "(aucun avertissement)"},
				{name: `Emprisonnements (${prisons.length})`, value: prisons.length ? prisons.map(this.getPrisonDetails).join("\n") : "(aucun emprisonnement)"},
				{name: `Hors-sujets (${offTopics.length})`, value: offTopics.length ? this.getOffTopicDetails(offTopics) : "(aucun hors-sujet)"},
				{name: `Invitations censurées (${forbiddenInvites.length})`, value: forbiddenInvites.length ? this.getForbiddenInvitesDetails(forbiddenInvites) : "(aucune invitation censurée)"}
			]
		});
		return userInfoEmbed;
	};
	getBanDetails = ban => `- ${this.formatDateShort(ban.startTime)} - ${ban.endTime ? this.formatDateShort(ban.endTime) : "(pas de date de fin)"} : ${ban.reason}`;
	getWarningDetails = warning => `- ${this.formatDateShort(warning.time)} : ${warning.reason}`;
	getPrisonDetails = prison => `- ${this.formatDateShort(prison.startTime)} - ${prison.endTime ? this.formatDateShort(prison.endTime) : "(pas de date de fin)"}`
	getOffTopicDetails = offTopics =>
		[...this.groupBy(offTopics, "channelId")]
		.map(([channelId, channelOffTopics]) => `- <#${channelId}> : ${channelOffTopics.length} hors-sujets (${this.getTotalMessageCount(channelOffTopics)} messages au total)`)
		.join("\n");
	getForbiddenInvitesDetails = forbiddenInvites =>
		[...this.groupBy(forbiddenInvites.map(forbiddenInvite => ({...forbiddenInvite, invite: `${forbiddenInvite.invite.url} (${forbiddenInvite.server.name})`})), "invite")]
		.map(([invite, serverInvites]) => `- ${invite} : ${serverInvites.length} occurrences censurées`)
		.join("\n");
	orderByTimeDescending = elements =>
		[...elements]
		.map(element => element.data)
		.sort(
			(firstElement, secondElement) => this.compareTimestamps(firstElement.startTime ?? firstElement.time, secondElement.startTime ?? secondElement.time)
		);
	compareTimestamps = (firstTimestamp, secondTimestamp) => (secondTimestamp.toMillis?.() ?? secondTimestamp) - (firstTimestamp.toMillis?.() ?? firstTimestamp);
	getTotalMessageCount = offTopics => offTopics.reduce((sum, offTopic) => sum + (offTopic.messageCount ?? 0), 0);
};
