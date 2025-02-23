"use strict";

import Discord from "discord.js";

export default class DiscordClientManager {
	constructor(bot, token) {
		this.bot = bot;
		this.discordClient = new Discord.Client({
			intents: [
			],
			partials: [
			]
		});
		this.attachActions();
		this.loginWithToken(token);
	};
	attachActions = () => [
		{triggerType: "once", event: Discord.Events.ClientReady, method: this.onClientReady},
	].forEach(action => this.discordClient[action.triggerType](action.event, action.method));
	onClientReady = () => {
		this.bot.logger.info("Discord client is ready.");
		this.setActivePresence();
	};
	setActivePresence = () => {
		this.discordClient.user.setPresence({status: "online", activities: [{type: Discord.ActivityType.Playing, name: "surveiller Cubeurs Francophones"}]})
		this.bot.logger.info("Presence has been set to active.")
	};
	setInactivePresence = () => {
		this.discordClient.user.setPresence({status: "idle", activities: [{type: Discord.ActivityType.Playing, name: "faire la sieste 😴"}]})
		this.bot.logger.info("Presence has been set to inactive.")
	};
	loginWithToken = token => {
		this.discordClient.login(token)
			.then(() => this.bot.logger.info("Login successful."))
			.catch(error => this.bot.logger.error(`Login failed : ${error}.`));
	};
	shutDown = async () => {
		this.setInactivePresence();
		await this.discordClient.destroy();
		this.bot.logger.info("Discord client has been shut down.");
	};
};

