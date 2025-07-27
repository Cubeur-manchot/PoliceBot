"use strict";

import Discord from "discord.js";

export default class CommandManager {
	constructor(bot) {
		this.bot = bot;
	};
	updateApplicationCommands = async () => {
		this.bot.logger.info("Start updating application commands.");
		let deployedCommands = await this.bot.discordClientManager.fetchApplicationCommands();
		if (this.areApplicationCommandsIdentical(deployedCommands)) {
			this.bot.logger.info("Application commands are already up-to-date.");
			return;
		}
		let commands = this.buildApplicationCommands();
		this.bot.discordClientManager.deployApplicationCommands(commands.map(command => command.toJSON()));
	};
	areApplicationCommandsIdentical = deployedCommands => {
		let commandCount = 0;
		let deployedCommandsMap = deployedCommands.reduce((deployedCommandsMap, command) => {
			if (!deployedCommandsMap[command.name]) {
				deployedCommandsMap[command.name] = {};
			}
			deployedCommandsMap[command.name][command.type] = command.type === Discord.ApplicationCommandType.ChatInput ? command : true;
			return deployedCommandsMap;
		}, {});
		for (let command of applicationCommands) { // check if all defined commands are deployed
			if (command.contexts.slash) {
				commandCount++;
				let deployedSlashCommand = deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.ChatInput];
				if (!deployedSlashCommand) {
					return false;
				}
				if (deployedSlashCommand.description !== command.description) {
					return false;
				}
				let deployedSlashCommandOptions = Object.entries(deployedSlashCommand.options.map(option => [option.name, option]));
				for (let commandOption of command.options ?? []) {
					let deployedCommandOption = deployedSlashCommandOptions[commandOption.name];
					if (!deployedCommandOption) {
						return false;
					}
					if (deployedCommandOption.required ^ commandOption.required) {
						return false;
					}
				}
				if (deployedSlashCommand.options.length !== command.options.length) {
					return false;
				}
			}
			if (command.contexts.user) {
				commandCount++;
				if (!deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.User]) {
					return false;
				}
			}
			if (command.contexts.message) {
				commandCount++;
				if (!deployedCommandsMap[command.name]?.[Discord.ApplicationCommandType.Message]) {
					return false;
				}
			}
		}
		if (deployedCommands.length !== commandCount) { // some commands are deployed but are not defined
			return false;
		}
		return true;
	};
	buildApplicationCommands = () =>
		applicationCommands.map(
			command => [
				command.contexts.slash ? command.getSlashApplicationCommand() : null,
				command.contexts.user ? command.getUserContextApplicationCommand() : null,
				command.contexts.message ? command.getMessageContextApplicationCommand() : null,
			].filter(Boolean)
		).flat();
};

class Command {
	constructor(commandInfo) {
		Object.assign(this, commandInfo);
	};
	getSlashApplicationCommand = () => {
		let applicationCommand = new Discord.SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);
		for (let commandOption of this.options ?? []) {
			applicationCommand.addStringOption(option => {
				option
					.setName(commandOption.name)
					.setDescription(commandOption.description)
					.setRequired(commandOption.required);
				if (commandOption.choices) {
					option.addChoices(...commandOption.choices);
				}
				return option;
			});
		}
		return applicationCommand;
	};
	getUserContextApplicationCommand = () => this.getContextMenuApplicationCommand(Discord.ApplicationCommandType.User);
	getMessageContextApplicationCommand = () => this.getContextMenuApplicationCommand(Discord.ApplicationCommandType.Message);
	getContextMenuApplicationCommand = type =>
		new Discord.ContextMenuCommandBuilder()
			.setType(type)
			.setName(this.name);
};

const applicationCommands = [
	new Command({
		name: "command1",
		description: "description of command1",
		options: null,
		contexts: {
			slash: true,
			user: true,
			message: false
		}
	}),
	new Command({
		name: "command2",
		description: "description of command2",
		options: null,
		contexts: {
			slash: false,
			user: true,
			message: true
		}
	})
];
