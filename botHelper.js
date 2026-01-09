"use strict";

export default class BotHelper {
	constructor(bot) {
		this.bot = bot;
		this.logger = this.bot.logger;
		this.logArgumentReplaceRegexp = /\{(\d+)\}/g;
	};
	dictionnize = (array, property) => new Map(array.map(element => [element[property], element]));
	dictionnizeArray = (array, property) => new Map(array.map(element => [element[property], [element]]));
	runAsync = async (asyncFunction, logSuccessMessagePattern, logErrorMessagePattern, logArguments, userErrorMessage) => {
		try {
			let result = await asyncFunction();
			if (logSuccessMessagePattern) {
				this.logger.info(`${this.replaceLogMessage(logSuccessMessagePattern, logArguments)}.`);
			}
			return result;
		} catch (asyncActionError) {
			this.logger.error(`${this.replaceLogMessage(logErrorMessagePattern, logArguments)} :`, asyncActionError);
			throw userErrorMessage ?? asyncActionError;
		}
	};
	replaceLogMessage = (message, logArguments) => message.replace(this.logArgumentReplaceRegexp, (match, index) => `"${logArguments?.[index] ?? match}"`);
	formatDate = timestamp => {
		let milliseconds = timestamp?.toMillis?.() ?? timestamp; // if Firestore Timestamp, convert into milliseconds
		return `<t:${Math.floor(milliseconds / 1000)}:F> (${new Date(milliseconds).toISOString()})`;
	};
	formatDateShort = timestamp => {
		let milliseconds = timestamp?.toMillis?.() ?? timestamp; // if Firestore Timestamp, convert into milliseconds
		return `<t:${Math.floor(milliseconds / 1000)}:F>`;
	};
};
