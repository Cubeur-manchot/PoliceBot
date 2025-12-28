"use strict";

import BotHelper from "./botHelper.js";
import ClientReadyEventHandler from "./eventHandlers/clientReadyEventHandler.js";
import InteractionCreateEventHandler from "./eventHandlers/interactionCreateEventHandler.js";
import ThreadCreateEventHandler from "./eventHandlers/threadCreateEventHandler.js";
import UserUpdateEventHandler from "./eventHandlers/userUpdateEventHandler.js";

export default class DiscordEventManager extends BotHelper {
	constructor(discordClientManager) {
		super(discordClientManager.bot);
		this.discordClientManager = discordClientManager;
		this.discordClient = discordClientManager.discordClient;
		let eventHandlers = [
			new ClientReadyEventHandler(this),
			new InteractionCreateEventHandler(this),
			new ThreadCreateEventHandler(this),
			new UserUpdateEventHandler(this)
		];
		this.eventHandlers = this.dictionnize(eventHandlers, "eventName");
		eventHandlers.forEach(eventHandler => eventHandler.attachEventToClient());
	};
};
