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
				Discord.GatewayIntentBits.GuildBans,
				Discord.GatewayIntentBits.GuildMembers,
				Discord.GatewayIntentBits.GuildMessages,
				Discord.GatewayIntentBits.GuildInvites,
				Discord.GatewayIntentBits.Guilds,
				Discord.GatewayIntentBits.MessageContent
			],
			partials: [
				Discord.Partials.Message
			]
		});
		this.discordActionManager = new DiscordActionManager(this);
		this.discordEventManager = new DiscordEventManager(this);
		this.loginWithToken(token);
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
