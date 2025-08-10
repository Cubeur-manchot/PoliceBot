"use strict";

export default class Logger {
	static levels = ["debug", "info", "warn", "error"];
	constructor(allowedLevels = []) {
		const levelIsAllowed = Object.fromEntries(allowedLevels.map(level => [level, true]));
		Logger.levels.forEach(logLevel => this[logLevel] = levelIsAllowed[logLevel]
			? (message, error) => console[logLevel](`[${new Date().toISOString()}][${logLevel}] ${message}`, error ?? "")
			: () => {}
		);
		this.info("Logger is ready.")
	};
};
