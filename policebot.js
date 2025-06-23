"use strict";

import Logger from "./logger.js";
import DiscordClientManager from "./discordClientManager.js";

export default class PoliceBot {
	constructor(logLevels, token) {
		this.logger = new Logger(logLevels);
		this.discordClientManager = new DiscordClientManager(this, token);
	};
	shutDown = async () => {
		this.logger.info("Shutting down the bot.")
		this.discordClientManager.shutDown();
	};
};
