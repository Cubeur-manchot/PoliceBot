"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class GuildMemberUpdateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.GuildMemberUpdate);
	};
	handleEvent = (oldMember, newMember) => {
		let nicknameChanged = oldMember.nickname !== newMember.nickname;
		let avatarChanged = oldMember.avatar !== newMember.avatar;
		let oldRoles = oldMember.roles.cache;
		let newRoles = newMember.roles.cache;
		let rolesChanged = !oldRoles.equals(newRoles);
		if (!nicknameChanged && !avatarChanged && !rolesChanged) {
			return;
		}
		let thumbnailUrl = newMember.avatarURL() ?? newMember.user.avatarURL();
		let differenceEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.user,
			title: "Profil de membre modifié",
			thumbnailUrl: thumbnailUrl,
			description: `Le profil de membre de <@${newMember.user.id}> (@${newMember.user.username}) a été modifié.`,
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
			if (removedRoles.has(process.env.PRISONER_ROLE_ID)) {
				let prisonerFreeEmbed = new DiscordEmbedMessageBuilder({
					color: DiscordEmbedMessageBuilder.colors.prison,
					title: "Membre libéré de prison",
					thumbnailUrl: thumbnailUrl,
					description: `<@${newMember.user.id}> (@${newMember.user.username}) n'est plus en prison.`,
				});
				this.discordActionManager.sendPoliceLogMessage({
					embeds: [prisonerFreeEmbed.embed]
				});
			} else if (addedRoles.has(process.env.PRISONER_ROLE_ID)) {
				let imprisonmentEmbed = new DiscordEmbedMessageBuilder({
					color: DiscordEmbedMessageBuilder.colors.prison,
					title: "Membre envoyé en prison",
					thumbnailUrl: thumbnailUrl,
					description: `<@${newMember.user.id}> (@${newMember.user.username}) est désormais en prison.`,
				});
				this.discordActionManager.sendPoliceLogMessage({
					embeds: [imprisonmentEmbed.embed]
				});
			}
		}
		let differenceEmbed = new DiscordEmbedMessageBuilder(differenceEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [differenceEmbed.embed]
		});
	};
};
