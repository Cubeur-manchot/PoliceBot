"use strict";

import Logger from "./logger.js";
import DiscordClientManager from "./discordClientManager.js";

export default class PoliceBot {
	constructor(prefix, logLevels, token) {
		this.prefix = prefix;
		this.logger = new Logger(logLevels);
		this.discordClientManager = new DiscordClientManager(this, token);
		this.logger.debug(this.prefix);
	};
	shutDown = async () => {
		this.logger.info("Shutting down the bot.")
		this.discordClientManager.shutDown();
	};
};
