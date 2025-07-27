"use strict";

import Command from "../command.js";

export default class CommandHandler {
	constructor(commandManager, commandName, commandContexts, commandDescription, commandOptions) {
		this.commandManager = commandManager;
		this.command = new Command(this, commandName, commandContexts, commandDescription, commandOptions);
		this.commandName = commandName;
	};
	handleCommand = () => {
		this.commandManager.bot.logger.error("Invoking 'handleCommand()' on an abstract class.");
	};
};
