"use strict";

import Discord from "discord.js";
import MessageEventHandler from "./messageEventHandler.js";

export default class MessageCreateEventHandler extends MessageEventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.MessageCreate, "envoyé");
	};
	handleEvent = async message => {
		if (this.ignoreMessage(message)) {
			return;
		}
		this.handleForbiddenInfractions(message);
		this.handleAttachmentsAndMentions(message);
	};
	handleAttachmentsAndMentions = message => {
		let hasAttachments = message.attachments.size > 0;
		let hasMentions = message.mentions.users.size > 0 || message.mentions.roles.size > 0;
		if (!hasAttachments && !hasMentions) {
			return;
		}
		let messageEmbedInput = {message, deleted: false};
		if (hasAttachments) {
			this.dataManager.cacheMessageAttachments(message.id, [...message.attachments.keys()]);
			messageEmbedInput.attachments = [...message.attachments.values()];
			messageEmbedInput.attachmentCount = message.attachments.size;
		}
		if (hasMentions) {
			let mentions = [
				...message.mentions.users.map(this.reduceUserMention),
				...message.mentions.roles.map(this.reduceRoleMention)
			];
			this.dataManager.cacheMessageMentions(message.id, mentions);
			messageEmbedInput.mentions = mentions;
		}
		this.sendMessageEmbedData(messageEmbedInput);
	};
};
