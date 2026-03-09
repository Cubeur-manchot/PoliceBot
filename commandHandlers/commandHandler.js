"use strict";

import Discord from "discord.js";
import Command from "../command.js";
import DiscordComponentMessageBuilder from "../messageBuilders/discordComponentMessageBuilder.js";
import BotHelper from "../botHelper.js";

export default class CommandHandler extends BotHelper {
	constructor(commandManager, commandName, commandContexts, commandDescription, commandOptions, modalFields) {
		super(commandManager.bot);
		this.commandManager = commandManager;
		this.discordActionManager = this.bot.discordClientManager.discordActionManager;
		this.dataManager = this.bot.dataManager;
		this.command = new Command(this, commandName, commandContexts, commandDescription, commandOptions, modalFields);
		this.commandName = commandName;
	};
	handleApplicationCommand = () => this.logger.error("Invoking \"handleApplicationCommand()\" on an abstract class.");
	handleModalSubmit = () => this.logger.error("Invoking \"handleModalSubmit()\" on an abstract class.");
	parseCommandOptions = options => Object.fromEntries(this.command.options.map(option => [option.name, options[option.type.getMethod](option.name)]));
	parseModalTextFields = fields => Object.fromEntries(this.command.modalFields.map(field => [field.name, fields.getTextInputValue(field.name)]));
	buildDiscordModal = (title, fields) => {
		let modal = new Discord.ModalBuilder()
			.setCustomId(this.commandName)
			.setTitle(title)
			.addComponents(fields.map(field => new Discord.ActionRowBuilder().addComponents(this.buildDiscordModalTextInput(field))));
		return modal;
	};
	buildDiscordModalTextInput = field => {
		let textInput = new Discord.TextInputBuilder()
			.setCustomId(field.name)
			.setLabel(field.label)
			.setStyle(field.isLong ? Discord.TextInputStyle.Paragraph : Discord.TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder(field.placeholder ?? "")
			.setMinLength(field.minLength ?? 0)
			.setMaxLength(field.maxLength ?? 4000);
		if (field.initialValue) { // prevent from form validation errors to show up at loading
			textInput.setValue(field.initialValue);
		}
		return textInput;
	};
	buildDiscordMessageWithUsersSelectComponents = (textContent, members, customId) =>
		new DiscordComponentMessageBuilder(textContent, [
			{type: DiscordComponentMessageBuilder.componentTypes.user, members, customId},
			{type: DiscordComponentMessageBuilder.componentTypes.button, label: "Valider", customId},
		]);
};
