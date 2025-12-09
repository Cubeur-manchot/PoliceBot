"use strict";

import BotHelper from "../botHelper.js";

export default class EventHandler extends BotHelper {
	constructor(eventManager, eventName, triggerType = "on") {
		super(eventManager.bot);
		this.eventManager = eventManager;
		this.discordActionManager = eventManager.discordClientManager.discordActionManager;
		this.eventName = eventName;
		this.triggerType = triggerType;
	};
	attachEventToClient = () => this.eventManager.discordClient[this.triggerType](this.eventName, this.handleEvent);
	handleEvent = () => this.logger.error("Invoking \"handleEvent()\" on an abstract class.");
};
