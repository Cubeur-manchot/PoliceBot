export default class Logger {
	static levels = ["debug", "info", "warn", "error"];
	constructor(allowedLevels = []) {
		Logger.levels.forEach(logLevel => this[logLevel] = allowedLevels.includes(logLevel)
			? message => this.writeLog(logLevel, message)
			: () => {}
		);
		process.on('uncaughtExceptionMonitor', (uncaughtError, originType) => this.writeLog(
			"critical",
			`Uncaught exception (${originType}) : ${uncaughtError?.stack ?? uncaughtError}`,
			"error"
		));
		this.info("Logger is ready.");
	};
	writeLog = (level, message, consoleLevel = level) => console[consoleLevel](
		JSON.stringify({
			timestamp: new Date().toISOString(),
			level,
			message
		})
	);
};
