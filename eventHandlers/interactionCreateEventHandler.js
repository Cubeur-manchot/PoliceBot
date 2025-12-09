"use strict";

import Discord from "discord.js";
import EventHandler from "./eventHandler.js";

export default class InteractionCreateEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.InteractionCreate);
	};
	handleEvent = interaction => {
		if (interaction.isCommand() || interaction.isModalSubmit() || interaction.isMessageComponent()) {
			this.bot.commandManager.handleCommand(interaction);
		}
	};
};
