"use strict";

import Discord from "discord.js";

export default class Command {
	constructor(commandHandler, name, contexts, description, options) {
		this.commandHandler = commandHandler;
		this.name = name;
		this.contexts = contexts;
		if (contexts.slash) {
			this.description = description;
			this.options = options;
		}
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
