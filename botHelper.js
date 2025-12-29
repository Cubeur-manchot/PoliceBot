"use strict";

export default class BotHelper {
	constructor(bot) {
		this.bot = bot;
		this.logger = this.bot.logger;
		this.logArgumentReplaceRegexp = /\{(\d+)\}/g;
	};
	dictionnize = (array, property) => Object.fromEntries(array.map(element => [element[property], element]));
	runAsync = async (asyncFunction, logSuccessMessagePattern, logErrorMessagePattern, logArguments, userErrorMessage) => {
		try {
			let result = await asyncFunction();
			this.logger.info(`${this.replaceLogMessage(logSuccessMessagePattern, logArguments)}.`);
			return result;
		} catch (asyncActionError) {
			this.logger.error(`${this.replaceLogMessage(logErrorMessagePattern, logArguments)} :`, asyncActionError);
			throw userErrorMessage ?? asyncActionError;
		}
	};
	replaceLogMessage = (message, logArguments) => message.replace(this.logArgumentReplaceRegexp, (match, index) => `"${logArguments?.[index] ?? match}"`);
	formatDate = timestamp => `<t:${Math.floor(timestamp / 1000)}:F> (${new Date(timestamp).toISOString()})`;
};
