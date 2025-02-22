"use strict";

import Logger from "./logger.js";

export default class PoliceBot {
	constructor(prefix, logLevels) {
		this.prefix = prefix;
		this.logger = new Logger(logLevels);
	};
};
