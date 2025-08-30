"use strict";

import Command from "../command.js";

export default class CommandHandler {
	constructor(commandManager, commandName, commandContexts, commandDescription, commandOptions) {
		this.commandManager = commandManager;
		this.discordClientManager = this.commandManager.bot.discordClientManager;
		this.dataManager = this.commandManager.bot.dataManager;
		this.command = new Command(this, commandName, commandContexts, commandDescription, commandOptions);
		this.commandName = commandName;
	};
	handleCommand = () => this.commandManager.bot.logger.error("Invoking 'handleCommand()' on an abstract class.");
	parseOptions = options => Object.fromEntries(this.command.options.map(option => [option.name, options[`get${option.type ?? Command.optionTypes.string}`](option.name)]));
};
