"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class GuildMemberUpdateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.GuildMemberUpdate);
	};
	handleEvent = async (oldMember, newMember) => {
		let nicknameChanged = oldMember.nickname !== newMember.nickname;
		let avatarChanged = oldMember.avatar !== newMember.avatar;
		let oldRoles = oldMember.roles.cache;
		let newRoles = newMember.roles.cache;
		let rolesChanged = !oldRoles.equals(newRoles);
		if (!nicknameChanged && !avatarChanged && !rolesChanged) {
			return;
		}
		let userId = newMember.user.id;
		let username = newMember.user.username;
		let differenceEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.user,
			title: "Profil de membre modifié",
			thumbnailUrl: newMember.displayAvatarURL(),
			description: `Le profil de membre de <@${userId}> (@${username}) a été modifié.`,
			fields: []
		};
		if (nicknameChanged) {
			differenceEmbedData.fields.push(
				{name: "Ancien pseudo de serveur", value: oldMember.nickname ?? "(pas de pseudo de serveur)", inline: true},
				{name: "Nouveau pseudo de serveur", value: newMember.nickname ?? "(pas de pseudo de serveur)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		if (avatarChanged) {
			differenceEmbedData.fields.push(
				{name: "Ancien avatar", value: oldMember.avatar ? `[Ancien avatar](${oldMember.avatarURL()})` : "(pas d'avatar de serveur)", inline: true},
				{name: "Nouvel avatar", value: newMember.avatar ? `[Nouvel avatar](${newMember.avatarURL()})` : "(pas d'avatar de serveur)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		if (rolesChanged) {
			let removedRoles = oldRoles.subtract(newRoles);
			let addedRoles = newRoles.subtract(oldRoles);
			differenceEmbedData.fields.push(
				{name: "Rôles supprimés", value: removedRoles.size > 0 ? [...removedRoles.keys()].map(roleId => `<@&${roleId}>`).join(", ") : "(aucun rôle supprimé)", inline: true},
				{name: "Rôles ajoutés", value: addedRoles.size > 0 ? [...addedRoles.keys()].map(roleId => `<@&${roleId}>`).join(", ") : "(aucun rôle ajouté)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			);
			if (addedRoles.has(process.env.PRISONER_ROLE_ID)) {
				let startTime = new Date();
				let imprisonmentEmbed = new DiscordEmbedMessageBuilder({
					color: DiscordEmbedMessageBuilder.colors.prison,
					title: "Membre envoyé en prison",
					thumbnailUrl: newMember.displayAvatarURL(),
					description: `<@${userId}> (@${username}) est désormais en prison.`,
					fields: [
						{name: "Date d'entrée", value: this.formatDate(startTime), inline: true},
						{name: "Date de sortie", value: "(pas de date de sortie)", inline: true}
					]
				});
				this.discordActionManager.sendPoliceLogMessage({
					embeds: [imprisonmentEmbed.embed]
				});
				let prison = {userId, startTime, endTime: null};
				this.dataManager.addPrison(prison);
			} else if (removedRoles.has(process.env.PRISONER_ROLE_ID)) {
				let activePrisons;
				try {
					activePrisons = await this.dataManager.getActivePrisons(userId);
				} catch {
					this.logger.warn(`User ${userId} was released from prison, but an error occurred when fetching the prison information from the database or the cache.`);
				}
				let endTime = new Date();
				let prisonData;
				if (activePrisons?.length) {
					let activePrison = this.getMostRecentActivePrison(activePrisons);
					prisonData = {...activePrison.data, endTime};
					this.dataManager.updatePrison(activePrison.id, prisonData);
				} else {
					prisonData = {userId, endTime};
					this.logger.warn(`User ${userId} was released from prison, but the prison information is missing from the database and the cache.`);
				}
				let prisonerReleaseEmbed = new DiscordEmbedMessageBuilder({
					color: DiscordEmbedMessageBuilder.colors.prison,
					title: "Membre libéré de prison",
					thumbnailUrl: newMember.displayAvatarURL(),
					description: `<@${userId}> (@${username}) n'est plus en prison.`,
					fields: [
						{name: "Date d'entrée", value: prisonData.startTime ? this.formatDate(prisonData.startTime) : "(impossible à déterminer)", inline: true},
						{name: "Date de sortie", value: this.formatDate(endTime), inline: true}
					]
				});
				this.discordActionManager.sendPoliceLogMessage({
					embeds: [prisonerReleaseEmbed.embed]
				});
			}
		}
		let differenceEmbed = new DiscordEmbedMessageBuilder(differenceEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [differenceEmbed.embed]
		});
	};
	getMostRecentActivePrison = activePrisons => activePrisons.reduce((mostRecentPrison, currentPrison) => mostRecentPrison.startTime > currentPrison.startTime ? mostRecentPrison : currentPrison);
};
