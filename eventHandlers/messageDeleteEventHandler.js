"use strict";

import Discord from "discord.js";
import MessageEventHandler from "./messageEventHandler.js";

export default class MessageDeleteEventHandler extends MessageEventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.MessageDelete, "supprimé");
	};
	handleEvent = async message => {
		if (this.ignoreMessage(message)) {
			return;
		}
		let messageEmbedInput = {
			message,
			// do not pass attachments because they don't exist anymore
			attachmentCount: this.dataManager.getCachedMessageAttachments(message.id)?.length ?? 0,
			mentions: this.dataManager.getCachedMessageMentions(message.id),
			deleted: true
		};
		this.sendMessageEmbedData(messageEmbedInput);
	};
};
