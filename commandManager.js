"use strict";

import Discord from "discord.js";
import BotHelper from "./botHelper.js";
import PrisonCommandHandler from "./commandHandlers/prisonCommandHandler.js";
import WhitelistCommandHandler from "./commandHandlers/whitelistCommandHandler.js";

export default class CommandManager extends BotHelper {
	constructor(bot) {
		super(bot);
		this.discordClientManager = this.bot.discordClientManager;
		let commandHandlers = [
			new PrisonCommandHandler(this),
			new WhitelistCommandHandler(this)
		];
		this.commandHandlers = this.dictionnize(commandHandlers, "commandName");
		this.commands = commandHandlers.map(commandHandler => commandHandler.command);
	};
	updateApplicationCommands = async () => {
		this.bot.logger.info("Start updating application commands.");
		let deployedCommands = await this.discordClientManager.fetchApplicationCommands();
		if (this.areApplicationCommandsIdentical(deployedCommands)) {
			this.bot.logger.info("Application commands are already up-to-date.");
			return;
		}
		let commands = this.buildApplicationCommands();
		this.discordClientManager.deployApplicationCommands(commands.map(command => command.toJSON()));
	};
	areApplicationCommandsIdentical = deployedCommands => {
		let deployedCommandsMap = deployedCommands.reduce((deployedCommandsMap, command) => {
			if (!deployedCommandsMap[command.name]) {
				deployedCommandsMap[command.name] = {};
			}
			deployedCommandsMap[command.name][command.type] = command.type === Discord.ApplicationCommandType.ChatInput ? command : true;
			return deployedCommandsMap;
		}, {});
		for (let command of this.commands) { // check if all defined commands are deployed
			if (command.contexts.slash) {
				let deployedSlashCommand = deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.ChatInput];
				if (!deployedSlashCommand) {
					return false;
				}
				if (deployedSlashCommand.description !== command.description) {
					return false;
				}
				let deployedSlashCommandOptions = this.dictionnize(deployedSlashCommand.options, "name");
				for (let commandOption of command.options ?? []) {
					let deployedCommandOption = deployedSlashCommandOptions[commandOption.name];
					if (!deployedCommandOption) {
						return false;
					}
					if (deployedCommandOption.required ^ commandOption.required) {
						return false;
					}
					if (deployedCommandOption.description !== commandOption.description) {
						return false;
					}
				}
				if (deployedSlashCommand.options.length !== command.options.length) {
					return false;
				}
			}
			if (command.contexts.user) {
				if (!deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.User]) {
					return false;
				}
			}
			if (command.contexts.message) {
				if (!deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.Message]) {
					return false;
				}
			}
		}
		let expectedCommandCount = this.commands.reduce((sum, command) => sum + command.contexts.slash + command.contexts.user + command.contexts.message, 0);
		if (deployedCommands.length !== expectedCommandCount) { // some commands are deployed but are not defined
			return false;
		}
		return true;
	};
	buildApplicationCommands = () =>
		this.commands.map(
			command => [
				command.contexts.slash ? command.getSlashApplicationCommand() : null,
				command.contexts.user ? command.getUserContextApplicationCommand() : null,
				command.contexts.message ? command.getMessageContextApplicationCommand() : null,
			].filter(Boolean)
		).flat();
	handleCommand = async interaction => {
		try {
			let answer = await this.commandHandlers[interaction.commandName].handleCommand(interaction);
			this.discordClientManager.replyInteraction(interaction, answer);
		} catch (error) {
			if (typeof error === "string") { // custom error with error message to user
				this.discordClientManager.replyInteraction(interaction, {content: `:x: ${error}.`});
			} else {
				throw error;
			}
		}
	};
};
