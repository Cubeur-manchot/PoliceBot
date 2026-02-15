"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class GuildMemberAddEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.GuildMemberAdd);
	};
	handleEvent = async member => {
		if (member.guild.id !== process.env.SERVER_ID) {
			return;
		}
		let sevenDays = 1000 * 60 * 60 * 24 * 7;
		let isUserRecent = this.isTimestampGreater(member.user.createdTimestamp, new Date(), sevenDays);
		let memberJoinedEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.invite,
			title: "Un membre a rejoint le serveur",
			thumbnailUrl: member.user.displayAvatarURL(),
			description: `<@${member.user.id}> (@${member.user.username}) a rejoint le serveur.`,
			fields: [
				{name: "Nom d'utilisateur", value: member.user.globalName ?? "(pas de nom d'utilisateur)", inline: true},
				{name: "Avatar", value: member.user.avatar ? `[Avatar](${member.user.avatarURL()})` : "(pas d'avatar)", inline: true},
				{name: "\u200B", value: "\u200B", inline: true},
				{name: "Arrivée sur Discord", value: `${this.formatDate(member.user.createdTimestamp)}${isUserRecent ? "\n:warning: Compte récent" : ""}`, inline: true},
				{name: "Arrivée sur le serveur", value: this.formatDate(member.joinedTimestamp), inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			]
		};
		let activeInvites = await this.bot.discordClientManager.discordActionManager.fetchInvites(); // fetch only; cache will be updated when invites are created or deleted
		let cachedInviteUsages = this.dataManager.getAllCachedInviteUsages();
		let cachedInviteUsagesMap = this.dictionnize(cachedInviteUsages, "code");
		let potentiallyUsedInvites = [
			...activeInvites
				.filter((invite, code) => (cachedInviteUsagesMap.get(code)?.uses ?? 0) + 1 === invite.uses) // cached uses + 1 === current uses
				.values(),
			...cachedInviteUsages
				.filter(cachedInviteUsage => cachedInviteUsage.uses + 1 === cachedInviteUsage.maxUses && !activeInvites.has(cachedInviteUsage.code)) // uses reached maxUse and invite no longer exists
				.map(cachedInviteUsage => ({...cachedInviteUsage, uses: cachedInviteUsage.maxUses}))
		];
		let usedInviteDescription = "(impossible à déterminer)";
		if (potentiallyUsedInvites.length === 1) {
			let usedInvite = potentiallyUsedInvites[0];
			usedInviteDescription = [
				`Code : ${usedInvite.code}`,
				`Créateur : <@${usedInvite.inviter.id}> (@${usedInvite.inviter.username})`,
				`Salon : <#${usedInvite.channel.id}> (${usedInvite.channel.name})`,
				`Date de création : ${this.formatDate(usedInvite.createdTimestamp)}`,
				`Date d'expiration : ${usedInvite.expiresTimestamp ? this.formatDate(usedInvite.expiresTimestamp) : "Jamais"}`,
				`Utilisations : ${usedInvite.uses} / ${usedInvite.maxUses === 0 ? "∞" : usedInvite.maxUses}`
			].join("\n");
		}
		memberJoinedEmbedData.fields.push({
			name: "Invitation utilisée",
			value : usedInviteDescription,
			inline: false
		});
		let memberJoinedEmbed = new DiscordEmbedMessageBuilder(memberJoinedEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [memberJoinedEmbed.embed]
		});
	};
};
