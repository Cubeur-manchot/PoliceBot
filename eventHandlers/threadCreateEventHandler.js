"use strict";

import Discord from "discord.js";
import EventHandler from "./eventHandler.js";

export default class ThreadCreateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.ThreadCreate);
	};
	handleEvent = thread => this.discordActionManager.joinThread(thread);
};
