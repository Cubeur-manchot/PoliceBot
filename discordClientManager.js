"use strict";

import Discord from "discord.js";

export default class DiscordClientManager {
	constructor(bot, token) {
		this.bot = bot;
		this.discordClient = new Discord.Client({
			intents: [
				Discord.GatewayIntentBits.Guilds
			],
			partials: [
			]
		});
		this.attachActions();
		this.loginWithToken(token);
	};
	attachActions = () => [
		{triggerType: "once", event: Discord.Events.ClientReady, method: this.onClientReady},
		{triggerType: "on", event: Discord.Events.InteractionCreate, method: this.onInteractionCreate},
		{triggerType: "on", event: Discord.Events.ThreadCreate, method: this.onThreadCreate}
	].forEach(action => this.discordClient[action.triggerType](action.event, action.method));
	onClientReady = () => {
		this.bot.logger.info("Discord client is ready.");
		this.setActivePresence();
		this.bot.commandManager.updateApplicationCommands();
	};
	onInteractionCreate = interaction => {
		if (interaction.isCommand()) {
			this.bot.commandManager.handleCommand(interaction);
		}
	};
	onThreadCreate = thread => this.joinThread(thread);
	setActivePresence = () => {
		this.discordClient.user.setPresence({status: "online", activities: [{type: Discord.ActivityType.Playing, name: "surveiller Cubeurs Francophones"}]})
		this.bot.logger.info("Presence has been set to active.")
	};
	setInactivePresence = () => {
		this.discordClient.user.setPresence({status: "idle", activities: [{type: Discord.ActivityType.Playing, name: "faire la sieste 😴"}]})
		this.bot.logger.info("Presence has been set to inactive.")
	};
	loginWithToken = async token => {
		try {
			await this.discordClient.login(token);
			this.bot.logger.info("Login successful.");
		} catch (loginError) {
			this.bot.logger.error("Login failed :", loginError);
			throw loginError;
		}
	};
	shutDown = async () => {
		this.setInactivePresence();
		await this.discordClient.destroy();
		this.bot.logger.info("Discord client has been shut down.");
	};
	fetchApplicationCommands = () => this.discordClient.rest.get(Discord.Routes.applicationGuildCommands(this.discordClient.application.id, process.env.SERVER_ID));
	deployApplicationCommands = applicationCommands =>
		this.discordClient.rest.put(Discord.Routes.applicationGuildCommands(this.discordClient.application.id, process.env.SERVER_ID), {body: applicationCommands})
		.then(() => this.bot.logger.info("Application commands have been updated successfully."))
		.catch(applicationCommandsPutError => this.bot.logger.error("Failed to update application commands :", applicationCommandsPutError));
	replyInteraction = (interaction, answer) =>
		interaction.reply(Object.assign(answer, {flags: Discord.MessageFlags.Ephemeral}))
		.catch(interactionReplyError => this.bot.logger.error("Failed to reply an interaction :", interactionReplyError));
	joinThread = async thread => {
		try {
			await thread.join();
			this.bot.logger.info(`Newly created thread "${thread.name}" in channel "${thread.parent?.name}" has been successfully joined.`);
		} catch (threadJoinError) {
			this.logger.error(`Failed to join newly created thread "${thread.name}" in channel "${thread.parent?.name}" :`, threadJoinError);
			throw threadJoinError;
		}
	};
	addRoleToMember = async (member, roleId) => {
		try {
			await member.roles.add(roleId);
			this.bot.logger.info(`Role with id "${roleId}" has been successfully added to member "${member.nickname ?? member.user.globalName} (${member.user.username})".`);
		} catch (roleAddError) {
			this.bot.logger.error(`Failed to add role with id "${roleId}" to member "${member.nickname ?? member.user.globalName} (${member.user.username})" :`, roleAddError);
			throw roleAddError;
		}
	};
};
