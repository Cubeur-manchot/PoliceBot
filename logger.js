"use strict";

export default class Logger {
	static levels = ["debug", "info", "warn", "error"];
	constructor(allowedLevels = []) {
		Logger.levels.forEach(logLevel => this[logLevel] = allowedLevels.includes(logLevel)
			? message => console[logLevel](JSON.stringify({
				timestamp: new Date().toISOString(),
				level: logLevel,
				message
			}))
			: () => {}
		);
		this.info("Logger is ready.")
	};
};
