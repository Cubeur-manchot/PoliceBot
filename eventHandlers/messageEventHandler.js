"use strict";

import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class MessageEventHandler extends EventHandler {
	constructor(eventManager, event, action) {
		super(eventManager, event);
		this.action = action;
	};
	ignoreMessage = message => {
		if (!message.inGuild()) {
			return true;
		}
		if (message.guild.id !== process.env.SERVER_ID) {
			return true;
		}
		if (message.author?.bot) {
			return true;
		}
		if (message.system) { // includes messages for new pinned message
			return true;
		}
		return false;
	};
	sendMessageEmbedData = async ({message, attachments, attachmentCount, mentions, deleted}) => {
		let {user, member} = await this.getAuthor(message);
		let messageEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.message,
			title: `Un message a été ${this.action}`,
			thumbnailUrl: member?.displayAvatarURL() ?? user?.displayAvatarURL(),
			description: `**Texte du message** :\n${message.content?.length ? message.content : "(texte vide)"}`,
			fields: [
				{name: "Date d'envoi", value: this.formatDate(message.createdTimestamp)},
				...(message.editedTimestamp ? [{name: "Date de dernière modification", value: this.formatDate(message.editedTimestamp)}] : []),
				{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
				deleted
					? {name: "\u200B", value: "\u200B", inline: true}
					: {name: "Lien", value: message.url, inline: true},
				{name: "\u200B", value: "\u200B", inline: true},
				{name: "Auteur", value: user ? `<@${user.id}> (@${user.username})` : "(auteur inconnu)", inline: true},
				attachmentCount
					? {name: "Pièces jointes", value: `${attachmentCount}`, inline: true}
					: {name: "\u200B", value: "\u200B", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			]
		};
		if (mentions) {
			let mentionsMap = this.groupBy(mentions, "type");
			messageEmbedData.fields.push(
				{
					name: "Mentions (membres)",
					value: mentionsMap.get("user")?.map(userMention => `- <@${userMention.id}> (@${userMention.name})`).join("\n") ?? "(aucun membre mentionné)",
					inline: true
				},
				{
					value: mentionsMap.get("role")?.map(roleMention => `- <@&${roleMention.id}> (@${roleMention.name})`).join("\n") ?? "(aucun rôle mentionné)",
					name: "Mentions (rôles)",
					inline: true
				},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		if (message.partial) {
			messageEmbedData.footer = {text: "Les informations sur le message supprimé sont partielles, certains champs peuvent être manquants."};
		}
		let messageEmbed = new DiscordEmbedMessageBuilder(messageEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [messageEmbed.embed],
			files: attachments
		});
	};
	getAuthor = async message => {
		let authorUser = message.author;
		if (!authorUser) {
			return {};
		}
		try {
			let authorMember = await this.discordActionManager.fetchMember(authorUser.id);
			return {user: authorUser, member: authorMember};
		} catch {
			return {user: authorUser};
		}
	};
};
