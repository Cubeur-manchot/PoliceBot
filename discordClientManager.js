"use strict";

import Discord from "discord.js";
import BotHelper from "./botHelper.js";
import DiscordActionManager from "./discordActionManager.js";
import DiscordEventManager from "./discordEventManager.js";

export default class DiscordClientManager extends BotHelper {
	constructor(bot, token) {
		super(bot);
		this.discordClient = new Discord.Client({
			intents: [
				Discord.GatewayIntentBits.Guilds
			],
			partials: [
			]
		});
		this.discordActionManager = new DiscordActionManager(this);
		this.attachActions();
		this.discordEventManager = new DiscordEventManager(this);
		this.loginWithToken(token);
	};
	attachActions = () => [
		{triggerType: "on", event: Discord.Events.InteractionCreate, method: this.onInteractionCreate}
	].forEach(action => this.discordClient[action.triggerType](action.event, action.method));
	onInteractionCreate = interaction => {
		if (interaction.isCommand() || interaction.isModalSubmit() || interaction.isMessageComponent()) {
			this.bot.commandManager.handleCommand(interaction);
		}
	};
	loginWithToken = async token => this.runAsync(
		() => this.discordClient.login(token),
		"Discord client has logged in successfully",
		"Failed to log in with Discord client"
	);
	shutDown = async () => {
		this.discordActionManager.setInactivePresence();
		await this.discordClient.destroy();
		this.logger.info("Discord client has been shut down.");
	};
};
