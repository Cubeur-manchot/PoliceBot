"use strict";

import BotHelper from "./botHelper.js";
import ClientReadyEventHandler from "./eventHandlers/clientReadyEventHandler.js";
import GuildMemberAddEventHandler from "./eventHandlers/guildMemberAddEventHandler.js";
import GuildMemberUpdateEventHandler from "./eventHandlers/guildMemberUpdateEventHandler.js";
import InteractionCreateEventHandler from "./eventHandlers/interactionCreateEventHandler.js";
import InviteCreateEventHandler from "./eventHandlers/inviteCreateEventHandler.js";
import InviteDeleteEventHandler from "./eventHandlers/inviteDeleteEventHandler.js";
import ThreadCreateEventHandler from "./eventHandlers/threadCreateEventHandler.js";
import UserUpdateEventHandler from "./eventHandlers/userUpdateEventHandler.js";

export default class DiscordEventManager extends BotHelper {
	constructor(discordClientManager) {
		super(discordClientManager.bot);
		this.discordClientManager = discordClientManager;
		this.discordClient = discordClientManager.discordClient;
		let eventHandlers = [
			new ClientReadyEventHandler(this),
			new GuildMemberAddEventHandler(this),
			new GuildMemberUpdateEventHandler(this),
			new InteractionCreateEventHandler(this),
			new InviteCreateEventHandler(this),
			new InviteDeleteEventHandler(this),
			new ThreadCreateEventHandler(this),
			new UserUpdateEventHandler(this)
		];
		this.eventHandlers = this.dictionnize(eventHandlers, "eventName");
		eventHandlers.forEach(eventHandler => eventHandler.attachEventToClient());
	};
};
