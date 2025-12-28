"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class UserUpdateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.UserUpdate);
	};
	handleEvent = (oldUser, newUser) => {
		let globalNameChanged = oldUser.globalName !== newUser.globalName;
		let avatarChanged = oldUser.avatar !== newUser.avatar;
		if (!globalNameChanged && !avatarChanged) {
			return;
		}
		let differenceEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.user,
			title: "Profil utilisateur modifié",
			thumbnailUrl: newUser.avatarURL(),
			description: `<@${newUser.id}> (@${newUser.username}) a modifié son profil utilisateur.`,
			fields: []
		};
		if (globalNameChanged) {
			differenceEmbedData.fields.push(
				{name: "Ancien nom d'utilisateur", value: oldUser.globalName ?? "(pas de nom d'utilisateur)", inline: true},
				{name: "Nouveau nom d'utilisateur", value: newUser.globalName ?? "(pas de nom d'utilisateur)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		if (avatarChanged) {
			differenceEmbedData.fields.push(
				{name: "Ancien avatar", value: oldUser.avatar ? `[Ancien avatar](${oldUser.avatarURL()})` : "(pas d'avatar)", inline: true},
				{name: "Nouvel avatar", value: newUser.avatar ? `[Nouvel avatar](${newUser.avatarURL()})` : "(pas d'avatar)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		let differenceEmbed = new DiscordEmbedMessageBuilder(differenceEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [differenceEmbed.embed]
		});
	};
};
