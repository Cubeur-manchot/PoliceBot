"use strict";

export default class Logger {
	static levels = ["debug", "info", "warn", "error"];
	constructor(allowedLevels = []) {
		Logger.levels.forEach(logLevel => this[logLevel] = allowedLevels.includes(logLevel)
			? (message, error) => console[logLevel](`[${new Date().toISOString()}][${logLevel}] ${message}`, error ?? "")
			: () => {}
		);
		this.info("Logger is ready.")
	};
};
