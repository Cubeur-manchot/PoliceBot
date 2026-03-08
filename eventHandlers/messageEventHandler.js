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
	handleMessage = async message => {
		let infractionHandlers = [
			this.handleForbiddenInvites,
			this.handleForbiddenExpressions
		];
		for (let infractionHandler of infractionHandlers) {
			let {infractions, embeds, dmMessageDetails} = await infractionHandler(message);
			if (infractions.length) {
				this.discordActionManager.deleteMessage(message);
				await this.dataManager.addInfractions(infractions);
				await this.discordActionManager.sendPoliceLogMessage({
					embeds: embeds.slice(0, 10).map(embed => embed.embed)
				});
				if (await this.countRecentInfractions(message.author.id) >= 3) {
					this.discordActionManager.addRoleToMember(message.member, process.env.PRISONER_ROLE_ID);
				}
				this.discordActionManager.sendPrivateMessage(
					message.author,
					{
						content: `Ton message dans le salon <#${message.channelId}> (${message.channel.name}) a été supprimé car il contenait ${dmMessageDetails}`
					}
				);
				return false;
			}
		}
		return true;
	};
	handleForbiddenInvites = async message => {
		let forbiddenInvites = await this.findForbiddenInvites(message.content);
		return {
			infractions: forbiddenInvites.map(forbiddenInvite => this.createForbiddenInviteInfraction(forbiddenInvite, message)),
			embeds: forbiddenInvites.map(forbiddenInvite => this.createForbiddenInviteEmbed(forbiddenInvite, message)),
			dmMessageDetails: forbiddenInvites.length
				? [
					"une ou plusieurs invitations vers des serveurs non autorisé :",
					...forbiddenInvites.map(forbiddenInvite => `- ${forbiddenInvite.invite.url} (serveur : ${forbiddenInvite.server.name})`)
				].join("\n")
				: null
		};
	};
	findForbiddenInvites = async textContent => {
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
	createForbiddenInviteInfraction = (invite, message) => ({
		userId: message.author.id,
		type: "Forbidden invite",
		time: new Date(),
		invite: invite.invite,
		server: {
			id: invite.server.id,
			name: invite.server.name
		}
	});
	createForbiddenInviteEmbed = (invite, message) => new DiscordEmbedMessageBuilder({
		color: DiscordEmbedMessageBuilder.colors.infraction,
		title: "Une invitation vers un serveur non autorisé a été envoyée",
		thumbnailUrl: this.getThumbnailUrl(message),
		description: `Texte du message :\n${message.content}`,
		fields: [
			{name: "Membre", value: `<@${message.author.id}> (@${message.guild.members.cache.get(`${message.author.id}`)?.user.username})`, inline: true},
			{name: "Date", value: this.formatDate(message.createdTimestamp), inline: true},
			{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
			{name: "Invitation", value: invite.invite.url, inline: true},
			{name: "Serveur", value: invite.server.name, inline: true},
			{name: "\u200B", value: "\u200B", inline: true}
		]
	});
	handleForbiddenExpressions = async message => {
		let forbiddenExpressions = await this.findForbiddenExpressions(message.content);
		return {
			infractions: forbiddenExpressions.map(expression => this.createForbiddenExpressionInfraction(expression, message)),
			embeds: forbiddenExpressions.map(expression => this.createForbiddenExpressionEmbed(expression, message)),
			dmMessageDetails: forbiddenExpressions.length
				? [
					"une ou plusieurs expressions interdites :",
					...forbiddenExpressions.map(expression => `- ${expression}`)
				].join("\n")
				: null
		};
	};
	findForbiddenExpressions = async textContent => {
		let forbiddenExpressions = [];
		try {
			let forbiddenExpressionsPattern = (await this.dataManager.getForbiddenExpressionsPatterns())[0]?.data;
			forbiddenExpressions.push(...textContent.match(forbiddenExpressionsPattern) ?? []);
		} catch {
			this.logger.error("Cannot get forbidden expressions pattern.");
		}
		return forbiddenExpressions;
	};
	createForbiddenExpressionInfraction = (expression, message) => ({
		userId: message.author.id,
		type: "Forbidden expression",
		time: new Date(),
		expression
	});
	createForbiddenExpressionEmbed = (expression, message) => new DiscordEmbedMessageBuilder({
		color: DiscordEmbedMessageBuilder.colors.infraction,
		title: "Une expression interdite a été envoyée",
		thumbnailUrl: this.getThumbnailUrl(message),
		description: `Texte du message :\n${message.content}`,
		fields: [
			{name: "Membre", value: `<@${message.author.id}> (@${message.guild.members.cache.get(`${message.author.id}`)?.user.username})`, inline: true},
			{name: "Date", value: this.formatDate(message.createdTimestamp), inline: true},
			{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
			{name: "Expression interdite", value: expression, inline: true},
			{name: "\u200B", value: "\u200B", inline: true},
			{name: "\u200B", value: "\u200B", inline: true}
		]
	});
	countRecentInfractions = async userId => {
		let infractions = await this.dataManager.getInfractions(userId);
		let fiveMinutes = 5 * 60 * 1000;
		return infractions.filter(infraction => this.isTimestampGreater(infraction.data.time, new Date(), fiveMinutes)).length;
	};
	sendMessageEmbedData = async ({message, attachments, attachmentCount, mentions, deleted}) => {
		let messageEmbedData = {
			color: DiscordEmbedMessageBuilder.colors.message,
			title: `Un message a été ${this.action}`,
			thumbnailUrl: this.getThumbnailUrl(message),
			description: `**Texte du message** :\n${message.content?.length ? message.content : "(texte vide)"}`,
			fields: [
				{name: "Date d'envoi", value: this.formatDate(message.createdTimestamp)},
				...(message.editedTimestamp ? [{name: "Date de dernière modification", value: this.formatDate(message.editedTimestamp)}] : []),
				{name: "Salon", value: `<#${message.channelId}> (${message.channel.name})`, inline: true},
				deleted
					? {name: "\u200B", value: "\u200B", inline: true}
					: {name: "Lien", value: message.url, inline: true},
				{name: "\u200B", value: "\u200B", inline: true},
				{name: "Auteur", value: message.author ? `<@${message.author.id}> (@${message.author.username})` : "(auteur inconnu)", inline: true},
				attachmentCount
					? {name: "Pièces jointes", value: `${attachmentCount}`, inline: true}
					: {name: "\u200B", value: "\u200B", inline: true},
				{name: "\u200B", value: "\u200B", inline: true}
			]
		};
		if (mentions) {
			let mentionsMap = this.groupBy(mentions, mention => mention.type);
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
	getThumbnailUrl = message => message.member?.displayAvatarURL() ?? message.author?.displayAvatarURL();
	addPartialMessageFooter = (messageEmbedData, message) => {
		if (message.partial) {
			messageEmbedData.footer = {text: "Les informations sur le message supprimé sont partielles, certains champs peuvent être manquants."};
		}
	};
	formatMention = mention => `- <@${mention.id}> (@${mention.name})`;
	reduceUserMention = user => ({type: "user", id: user.id, name: user.username});
	reduceRoleMention = role => ({type: "role", id: role.id, name: role.name});
};
