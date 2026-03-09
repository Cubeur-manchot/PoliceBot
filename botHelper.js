"use strict";

export default class BotHelper {
	constructor(bot) {
		this.bot = bot;
		this.logger = this.bot.logger;
		this.logArgumentReplaceRegexp = /\{(\d+)\}/g;
	};
	dictionnize = (array, property) => new Map(array.map(element => [element[property], element]));
	dictionnizeArray = (array, property) => new Map(array.map(element => [element[property], [element]]));
	groupBy = (array, getKey) => array.reduce((map, element) => {
		let key = getKey(element);
		if (map.has(key)) {
			map.get(key).push(element);
		} else {
			map.set(key, [element]);
		}
		return map;
	}, new Map());
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
	getMilliseconds = timestamp =>
		timestamp.getTime?.() // Date
		?? timestamp?.toMillis?.() // Firestore Timestamp
		?? timestamp; // number
	formatDate = timestamp => {
		let milliseconds = this.getMilliseconds(timestamp);
		return `<t:${Math.floor(milliseconds / 1000)}:F> (${new Date(milliseconds).toISOString()})`;
	};
	formatDateShort = timestamp => {
		let milliseconds = this.getMilliseconds(timestamp);
		return `<t:${Math.floor(milliseconds / 1000)}:F>`;
	};
	isTimestampGreater = (timestamp1, timestamp2, pastMargin = 0) => this.getMilliseconds(timestamp1) >= this.getMilliseconds(timestamp2) - pastMargin;
};
