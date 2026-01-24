"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import MessageEventHandler from "./messageEventHandler.js";

export default class MessageUpdateEventHandler extends MessageEventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.MessageUpdate);
	};
	handleEvent = async (oldMessage, newMessage) => {
		if (this.ignoreMessage(newMessage)) {
			return;
		}
		this.handleAttachmentsAndMentions(oldMessage, newMessage);
	};
	handleAttachmentsAndMentions = async (oldMessage, newMessage) => {
		let {user, member} = await this.getAuthor(newMessage);
		let messageUpdateEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.message,
			title: `Un message a été modifié`,
			thumbnailUrl: member?.displayAvatarURL() ?? user?.displayAvatarURL(),
			...(oldMessage.content !== newMessage.content && {description: [
				"**Ancien texte** :",
				oldMessage.content?.length ? this.escapeMarkdownBlocks(oldMessage.content) : "(texte vide)",
				"**Nouveau texte** :",
				newMessage.content?.length ? this.escapeMarkdownBlocks(newMessage.content) : "(texte vide)"
			].join("\n")}),
			fields: [
				{name: "Date d'envoi", value: this.formatDate(newMessage.createdTimestamp)},
				{name: "Date de modification", value: this.formatDate(newMessage.editedTimestamp)},
				{name: "Salon", value: `<#${newMessage.channelId}> (${newMessage.channel.name})`, inline: true},
				{name: "Lien", value: newMessage.url, inline: true},
				{name: "Auteur", value: user ? `<@${user.id}> (@${user.username})` : "(auteur inconnu)", inline: true},
			]
		};
		let removedAttachments; // when updating a message, attachments can only be removed (not added or replaced)
		if (!oldMessage.partial) {
			removedAttachments = oldMessage.attachments.filter(oldAttachment => !newMessage.attachments.has(oldAttachment.id));
			this.dataManager.cacheMessageAttachments(newMessage.id, [...newMessage.attachments.keys()]);
			if (removedAttachments.size) {
				messageUpdateEmbedData.fields.push(
					{name: "Pièces jointes supprimées", value: `${removedAttachments.size}`, inline: true},
					{name: "Pièces jointes restantes", value: `${newMessage.attachments.size}`, inline: true},
					{name: "\u200B", value: "\u200B", inline: true}
				);
			}
			let userMentionsChanged = !oldMessage.mentions.users.equals(newMessage.mentions.users);
			let roleMentionsChanged = !oldMessage.mentions.roles.equals(newMessage.mentions.roles);
			if (userMentionsChanged || roleMentionsChanged) {
				let newMentions = [
					...newMessage.mentions.users.map(this.reduceUserMention),
					...newMessage.mentions.roles.map(this.reduceRoleMention)
				];
				this.dataManager.cacheMessageMentions(newMessage.id, newMentions);
				if (userMentionsChanged) {
					let removedUserMentions = oldMessage.mentions.users.subtract(newMessage.mentions.users).map(this.reduceUserMention);
					let addedUserMentions = newMessage.mentions.users.subtract(oldMessage.mentions.users).map(this.reduceUserMention);
					messageUpdateEmbedData.fields.push(
						{name: "Mentions supprimées (membres)", value: removedUserMentions.length ? removedUserMentions.map(this.formatMention).join("\n") : "(aucun membre mentionné)", inline: true},
						{name: "Mentions ajoutées (membres)", value: addedUserMentions.length ? addedUserMentions.map(this.formatMention).join("\n") : "(aucun membre mentionné)", inline: true},
						{name: "\u200B", value: "\u200B", inline: true}
					);
				}
				if (roleMentionsChanged) {
					let removedRoleMentions = oldMessage.mentions.roles.subtract(newMessage.mentions.roles).map(this.reduceRoleMention);
					let addedRoleMentions = newMessage.mentions.roles.subtract(oldMessage.mentions.roles).map(this.reduceRoleMention);
					messageUpdateEmbedData.fields.push(
						{name: "Mentions supprimées (rôles)", value: removedRoleMentions.length ? removedRoleMentions.map(this.formatMention).join("\n") : "(aucun rôle mentionné)", inline: true},
						{name: "Mentions ajoutées (rôles)", value: addedRoleMentions.length ? addedRoleMentions.map(this.formatMention).join("\n") : "(aucun rôle mentionné)", inline: true},
						{name: "\u200B", value: "\u200B", inline: true}
					);
				}
			}
		}
		this.addPartialMessageFooter(messageUpdateEmbedData, oldMessage);
		let messageUpdateEmbed = new DiscordEmbedMessageBuilder(messageUpdateEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [messageUpdateEmbed.embed],
			...(removedAttachments && {files: [...removedAttachments.values()]})
		});
	};
	escapeMarkdownBlocks = textContent => textContent.replace(/([*_~|`[\]\(\)])/g, "\\$1"); // add \ before markdown blocks delimiters characters : *_~|`[]()
};
