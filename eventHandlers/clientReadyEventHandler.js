"use strict";

import Discord from "discord.js";
import EventHandler from "./eventHandler.js";

export default class ClientReadyEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.ClientReady, "once");
	};
	handleEvent = async () => {
		this.logger.info("Discord client is ready.");
		this.discordActionManager.setActivePresence();
		await this.bot.commandManager.updateApplicationCommands();
		await this.discordActionManager.fetchMembers(); // preload server members in cache to allow the detection of updates
		await this.dataManager.buildInvitesCache();
		await this.dataManager.buildPinnedMessagesCache(true);
		this.logger.info("Bot is fully ready.");
		this.discordActionManager.emitTickEvent();
		this.eventManager.setupScheduledTickEvent();
	};
};
