"use strict";

export default class BotHelper {
	constructor(bot) {
		this.bot = bot;
		this.logger = this.bot.logger;
		this.logArgumentReplaceRegexp = /\{(\d+)\}/g;
	};
	dictionnize = (array, property) => Object.fromEntries(array.map(element => [element[property], element]));
	runAsync = async (asyncMethod, successMessage, errorMessage, logArguments) => {
		try {
			let result = await asyncMethod();
			this.logger.info(`${this.replaceLogMessage(successMessage, logArguments)}.`);
			return result;
		} catch (asyncActionError) {
			this.logger.error(`${this.replaceLogMessage(errorMessage, logArguments)} :`, asyncActionError);
			throw asyncActionError;
		}
	};
	replaceLogMessage = (message, logArguments) => message.replace(this.logArgumentReplaceRegexp, (match, index) => `"${logArguments?.[index] ?? match}"`);
};
