"use strict";

import Discord from "discord.js";
import EventHandler from "./eventHandler.js";

export default class ClientReadyEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.ClientReady, "once");
	};
	handleEvent = () => {
		this.logger.info("Discord client is ready.");
		this.discordActionManager.setActivePresence();
		this.bot.commandManager.updateApplicationCommands();
	};
};
