"use strict";

export default class BotHelper {
	constructor(bot) {
		this.bot = bot;
		this.logger = this.bot.logger;
	};
	dictionnize = (array, property) => Object.fromEntries(array.map(element => [element[property], element]));
};
