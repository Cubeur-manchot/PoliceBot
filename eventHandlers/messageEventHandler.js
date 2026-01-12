"use strict";

import EventHandler from "./eventHandler.js";

export default class MessageEventHandler extends EventHandler {
	constructor(eventManager, event) {
		super(eventManager, event);
	};
	ignoreMessage = message => {
		if (!message.inGuild()) {
			return true;
		}
		if (message.guild.id !== process.env.SERVER_ID) {
			return true;
		}
		if (message.author.bot) {
			return true;
		}
		if (message.system) { // includes messages for new pinned message
			return true;
		}
		return false;
	};
	getAuthor = async message => {
		let authorUser = message.author;
		try {
			let authorMember = await this.discordActionManager.fetchMember(authorUser.id);
			return {user: authorUser, member: authorMember};
		} catch {
			return {user: authorUser};
		}
	};
};
