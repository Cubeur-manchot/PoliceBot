"use strict";

import Discord from "discord.js";

export default class Command {
	static optionTypes = {
		string: "String",
		user: "User"
	};
	constructor(commandHandler, name, contexts, description, options, modalFields) {
		this.commandHandler = commandHandler;
		this.name = name;
		this.contexts = contexts;
		if (contexts.slash) {
			this.description = description;
			this.options = options;
			this.modalFields = modalFields;
		}
	};
	getSlashApplicationCommand = () => {
		let applicationCommand = new Discord.SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
			.setDefaultMemberPermissions(Discord.PermissionsBitField.Flags.BanMembers)
			.setDMPermission(false);
		for (let commandOption of this.options ?? []) {
			applicationCommand[`add${commandOption.type ?? Command.optionTypes.string}Option`](option => {
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
			.setName(this.name)
			.setDefaultMemberPermissions(Discord.PermissionsBitField.Flags.BanMembers)
			.setDMPermission(false);
};
