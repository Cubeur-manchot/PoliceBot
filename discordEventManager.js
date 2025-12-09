"use strict";

import BotHelper from "./botHelper.js";
import ClientReadyEventHandler from "./eventHandlers/clientReadyEventHandler.js";
import ThreadCreateEventHandler from "./eventHandlers/threadCreateEventHandler.js";

export default class DiscordEventManager extends BotHelper {
	constructor(discordClientManager) {
		super(discordClientManager.bot);
		this.discordClientManager = discordClientManager;
		this.discordClient = discordClientManager.discordClient;
		let eventHandlers = [
		];
		this.eventHandlers = this.dictionnize(eventHandlers, "eventName");
		eventHandlers.forEach(eventHandler => eventHandler.attachEventToClient());
	};
};
