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
					value: mentionsMap.get("user")?.map(this.formatMention).join("\n") ?? "(aucun membre mentionné)",
					inline: true
				},
				{
					name: "Mentions (rôles)",
					value: mentionsMap.get("role")?.map(this.formatMention).join("\n") ?? "(aucun rôle mentionné)",
					inline: true
				},
				{name: "\u200B", value: "\u200B", inline: true}
			);
		}
		this.addPartialMessageFooter(messageEmbedData, message);
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
	addPartialMessageFooter = (messageEmbedData, message) => {
		if (message.partial) {
			messageEmbedData.footer = {text: "Les informations sur le message supprimé sont partielles, certains champs peuvent être manquants."};
		}
	};
	formatMention = mention => `- <@${mention.id}> (@${mention.name})`;
	reduceUserMention = user => ({type: "user", id: user.id, name: user.username});
	reduceRoleMention = role => ({type: "role", id: role.id, name: role.name});
	handleForbiddenInfractions = async message => {
		let forbiddenInvites = await this.findForbiddenInvites(message.content);
		if (!forbiddenInvites.length) {
			return;
		}
		let infractions = forbiddenInvites.map(invite => ({
			userId: message.author.id,
			type: "Forbidden invite",
			time: new Date(),
			invite: invite.invite,
			server: {
				id: invite.server.id,
				name: invite.server.name
			}
		}));
		this.dataManager.addInfractions(infractions);
		let thumbnailUrl;
		try {
			let authorMember = await this.discordActionManager.fetchMember(message.author.id);
			thumbnailUrl = authorMember.displayAvatarURL();
		} catch {
			thumbnailUrl = message.author.displayAvatarURL();
		}
		for (let infraction of infractions) {
			let forbiddenInviteEmbed = new DiscordEmbedMessageBuilder({
				color: DiscordEmbedMessageBuilder.colors.infraction,
				title: "Une invitation vers un serveur non whitelisté a été envoyée",
				thumbnailUrl,
				...(message.content.length !== 0 && {description: `Texte du message :\n${message.content}`}),
				fields: [
					{name: "Membre", value: `<@${infraction.userId}> (@${message.guild.members.cache.get(`${infraction.userId}`)?.user.username})`, inline: true},
					{name: "Date", value: this.formatDate(message.createdTimestamp), inline: true},
					{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
					{name: "Invitation", value: infraction.invite.url, inline: true},
					{name: "Serveur", value: infraction.server.name, inline: true},
					{name: "`\u200B`", value: "`\u200B`", inline: true}
				]
			});
			await this.discordActionManager.sendPoliceLogMessage({
				embeds: [forbiddenInviteEmbed.embed]
			});
		}
	};
	findForbiddenInvites = async textContent => {
		this.logger.debug("find forbidden invites")
		let inviteUrls = textContent.match(/https?:\/\/discord\.(?:gg|com\/invite)\/[0-9a-z-]+/gi);
		let forbiddenInvites = [];
		for (let inviteUrl of inviteUrls ?? []) {
			let inviteId = inviteUrl.match(new RegExp("(?<=https?:\/\/discord\.(?:gg|com\/invite)\/)[0-9a-z-]+", "gi"))[0];
			if (!inviteId) {
				continue;
			}
			let serverInfo;
			try {
				serverInfo = (await this.dataManager.getServerInfo(inviteId)).data;
			} catch { // if any issue with the invite, ignore it
				continue;
			}
			if (serverInfo.isWhitelisted) {
				continue;
			}
			forbiddenInvites.push({
				invite: {
					id: inviteId,
					url: inviteUrl
				},
				server: {
					id: serverInfo.id,
					name: serverInfo.name
				}
			});
		}
		return forbiddenInvites;
	};
};
