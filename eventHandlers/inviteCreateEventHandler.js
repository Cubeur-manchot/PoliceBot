"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class InviteCreateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.InviteCreate);
	};
	handleEvent = async invite => {
		let {type, guild: {id: serverId} = {}, inviter: inviterUser, createdTimestamp, channel, code, expiresTimestamp, maxUses} = invite;
		if (serverId !== process.env.SERVER_ID) {
			return;
		}
		if (type !== 0) { // standard invite to channel
			return;
		}
		let inviterMember = guild.members.cache.get(inviterUser.id);
		let inviteCreateEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.invite,
			title: "Invitation créée",
			thumbnailUrl: inviterMember?.displayAvatarURL() ?? inviterUser.displayAvatarURL(),
			description: `<@${inviterUser.id}> (@${inviterUser.username}) a créé une nouvelle invitation.`,
			fields: [
				{name: "Créateur", value: `<@${inviterUser.id}> (@${inviterUser.username})`, inline: true},
				{name: "Salon", value: `<#${channel.id}> (${channel.name})`, inline: true},
				{name: "Code", value: code, inline: true},
				{name: "Date de création", value: this.formatDate(createdTimestamp), inline: true},
				{name: "Date d'expiration", value: expiresTimestamp ? this.formatDate(expiresTimestamp) : "Jamais", inline: true},
				{name: "Limite d'utilisations", value: maxUses === 0 ? "∞" : `${maxUses}`, inline: true}
			]
		});
		this.discordActionManager.sendInfoLogMessage({
			embeds: [inviteCreateEmbed.embed]
		});
		this.dataManager.buildInvitesCache();
	};
};
