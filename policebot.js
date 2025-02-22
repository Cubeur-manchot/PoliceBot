"use strict";

import Logger from "./logger.js";

export default class PoliceBot {
	constructor() {
		this.logger = new Logger(process.env.LOG_LEVELS.split(","));
	};
};
