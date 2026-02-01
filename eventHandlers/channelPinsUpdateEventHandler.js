"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class ChannelPinsUpdateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.ChannelPinsUpdate);
	};
	handleEvent = async channel => {
		if (channel.guildId !== process.env.SERVER_ID) {
			return;
		}
		let cachedPinnedMessages = this.dataManager.getCachedPinnedMessages(channel.id);
		let actualPinnedMessages = await this.discordActionManager.fetchPinnedMessages(channel);
		this.dataManager.cachePinnedMessages(channel.id, actualPinnedMessages);
		if (!cachedPinnedMessages) {
			this.logger.warn(`Couldn't get cached pinned messages for channel "${channel.id}" because the cache is empty. Ignoring the event.`);
			return;
		}
		let action;
		let affectedPinnedMessage;
		switch (actualPinnedMessages.length - cachedPinnedMessages.length) {
			case 0:
				this.logger.warn(`Event ChannelPinsUpdate was fired in channel "${channel.id}" (${channel.name}) but the cache and the fetch are both returning ${actualPinnedMessages.length} messages. Ignoring the event.`);
				return;
			case -1:
				action = "désépinglé";
				affectedPinnedMessage = this.findExtraElement(cachedPinnedMessages, actualPinnedMessages);
				break;
			case 1:
				action = "épinglé";
				affectedPinnedMessage = this.findExtraElement(actualPinnedMessages, cachedPinnedMessages);
				break;
			default:
				this.logger.warn(`Event ChannelPinsUpdate was fired in channel "${channel.id}" (${channel.name}) but there is more than 1 message difference (${actualPinnedMessages.length} vs ${cachedPinnedMessages?.length}). Ignoring the event.`);
				return;
		};
		let affectedMessage = affectedPinnedMessage.message;
		let authorMember = affectedMessage.member;
		let richContentDescription = [
			`Fichiers joints: ${affectedMessage.attachments.size}`,
			`Embeds: ${affectedMessage.embeds.length}`,
			`Composants: ${affectedMessage.components.length}`
		].join("\n");
		let channelPinsUpdateEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.message,
			title: `Message ${action}`,
			thumbnailUrl: authorMember?.displayAvatarURL() ?? authorMember?.user.displayAvatarURL(),
			description: `Le message suivant a été ${action}.`,
			fields: [
				{name: "Créateur", value: `<@${authorMember.id}> (@${authorMember.user.username})`, inline: true},
				{name: "Salon", value: `<#${channel.id}> (${channel.name})`, inline: true},
				{name: "Lien", value: affectedMessage.url, inline: true},
				{name: "Texte", value: affectedMessage.content.length ? affectedMessage.content : "(pas de texte)", inline: true},
				{name: "Contenu enrichi", value: richContentDescription, inline: true},
				{name: "\u200B", value: "\u200B", inline: true},
				{name: "Date de création", value: this.formatDate(affectedMessage.createdTimestamp), inline: true},
				{name: "Date de modification", value: affectedMessage.editedTimestamp ? this.formatDate(affectedMessage.editedTimestamp) : "(jamais modifié)", inline: true},
				{name: "Date d'épinglage", value: this.formatDate(affectedPinnedMessage.pinnedTimestamp), inline: true}
			]
		});
		this.discordActionManager.sendInfoLogMessage({
			embeds: [channelPinsUpdateEmbed.embed],
			files: [...affectedMessage.attachments.values()]
		});
	};
	findExtraElement = (completeList, incompleteList) => {
		let incompleteIdSet = new Set(incompleteList.map(element => element.message.id));
		return completeList.find(element => !incompleteIdSet.has(element.message.id));
	};
};
