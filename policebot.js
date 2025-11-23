"use strict";

import CommandManager from "./commandManager.js";
import DataManager from "./dataManagers/dataManager.js";
import DiscordClientManager from "./discordClientManager.js";
import Logger from "./logger.js";

export default class PoliceBot {
	constructor(logLevels, token) {
		this.logger = new Logger(logLevels);
		this.discordClientManager = new DiscordClientManager(this, token);
		this.dataManager = new DataManager(this);
		this.commandManager = new CommandManager(this);
	};
	shutDown = async () => {
		this.logger.info("Shutting down the bot.")
		this.discordClientManager.shutDown();
	};
};
