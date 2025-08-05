"use strict";

import CommandManager from "./commandManager.js";
import DataManager from "./dataManager.js";
import DiscordClientManager from "./discordClientManager.js";
import Logger from "./logger.js";

export default class PoliceBot {
	constructor(logLevels, token) {
		this.logger = new Logger(logLevels);
		this.commandManager = new CommandManager(this);
		this.dataManager = new DataManager(this);
		this.discordClientManager = new DiscordClientManager(this, token);
	};
	shutDown = async () => {
		this.logger.info("Shutting down the bot.")
		this.discordClientManager.shutDown();
	};
};
