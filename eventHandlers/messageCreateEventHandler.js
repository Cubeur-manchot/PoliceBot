"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class CreateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.MessageCreate);
	};
	handleEvent = async message => {
		if (!message.inGuild()) {
			return;
		}
		if (message.guild.id !== process.env.SERVER_ID) {
			return;
		}
		if (message.author.bot) {
			return;
		}
		if (message.system) { // includes messages for new pinned message
			return;
		}
		let mentions = [
			...message.mentions.users.map(user => ({type: "user", id: user.id, name: user.username})),
			...message.mentions.roles.map(role => ({type: "role", id: role.id, name: role.name}))
		];
		let authorUser = message.author;
		let authorMember;
		try {
			authorMember = await this.discordActionManager.fetchMember(authorUser.id);
		} catch {}
		let hasAttachments = message.attachments.size !== 0;
		let hasMentions = mentions.length !== 0;
		if (!hasAttachments && !hasMentions) {
			return;
		}
		let messageCreateEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.message,
			title: "Un message a été envoyé",
			thumbnailUrl: authorMember?.displayAvatarURL() ?? authorUser.displayAvatarURL(),
			description: `**Texte du message** :\n${message.content?.length ? message.content : "(texte vide)"}`,
			fields: [
				{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
				{name: "Date d'envoi", value: this.formatDate(message.createdTimestamp), inline: true},
				{name: "Lien", value: message.url, inline: true}
			]
		};
		if (hasAttachments) {
			this.dataManager.cacheMessageAttachments(message.id, [...message.attachments.keys()]);
			messageCreateEmbedData.fields.push(
				{name: "Pièces jointes", value: `${message.attachments.size} fichier(s) (voir ci-joint)`}
			);
		}
		if (hasMentions) {
			this.dataManager.cacheMessageMentions(message.id, mentions);
			let mentionsMap = this.groupBy(mentions, "type");
			messageCreateEmbedData.fields.push(
				{
					name: "Mentions (membres)",
					value: mentionsMap.get("user")?.map(userMention => `- <@${userMention.id}> (@${userMention.name})`).join("\n") ?? "(aucun membre mentionné)",
					inline: true
				},
				{
					name: "Mentions (roles)",
					value: mentionsMap.get("role")?.map(roleMention => `- <@&${roleMention.id}> (@${roleMention.name})`).join("\n") ?? "(aucun rôle mentionné)",
					inline: true
				},
			);
		}
		let messageCreateEmbed = new DiscordEmbedMessageBuilder(messageCreateEmbedData);
		this.discordActionManager.sendInfoLogMessage({
			embeds: [messageCreateEmbed.embed],
			files: [...message.attachments.values()]
		});
	};
};
