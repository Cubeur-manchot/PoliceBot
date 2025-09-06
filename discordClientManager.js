"use strict";

import Discord from "discord.js";
import BotHelper from "./botHelper.js";

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
		this.attachActions();
		this.loginWithToken(token);
	};
	attachActions = () => [
		{triggerType: "once", event: Discord.Events.ClientReady, method: this.onClientReady},
		{triggerType: "on", event: Discord.Events.InteractionCreate, method: this.onInteractionCreate},
		{triggerType: "on", event: Discord.Events.ThreadCreate, method: this.onThreadCreate}
	].forEach(action => this.discordClient[action.triggerType](action.event, action.method));
	onClientReady = () => {
		this.logger.info("Discord client is ready.");
		this.setActivePresence();
		this.bot.commandManager.updateApplicationCommands();
	};
	onInteractionCreate = interaction => {
		if (interaction.isCommand() || interaction.isModalSubmit()) {
			this.bot.commandManager.handleCommand(interaction);
		}
	};
	onThreadCreate = thread => this.joinThread(thread);
	setActivePresence = () => {
		this.discordClient.user.setPresence({status: "online", activities: [{type: Discord.ActivityType.Playing, name: "surveiller Cubeurs Francophones"}]});
		this.logger.info("Presence has been set to active.");
	};
	setInactivePresence = () => {
		this.discordClient.user.setPresence({status: "idle", activities: [{type: Discord.ActivityType.Playing, name: "faire la sieste 😴"}]});
		this.logger.info("Presence has been set to inactive.");
	};
	loginWithToken = async token => this.runAsync(
		() => this.discordClient.login(token),
		"Discord client has logged in successfully",
		"Failed to log in with Discord client"
	);
	shutDown = async () => {
		this.setInactivePresence();
		await this.discordClient.destroy();
		this.logger.info("Discord client has been shut down.");
	};
	fetchApplicationCommands = async () => this.runAsync(
		() => this.discordClient.rest.get(Discord.Routes.applicationGuildCommands(this.discordClient.application.id, process.env.SERVER_ID)),
		"Application commands of server {0} have been fetched successfully",
		"Failed to fetch application commands of server {0}",
		[process.env.SERVER_ID]
	);
	deployApplicationCommands = async applicationCommands => this.runAsync(
		() => this.discordClient.rest.put(Discord.Routes.applicationGuildCommands(this.discordClient.application.id, process.env.SERVER_ID), {body: applicationCommands}),
		"Application commands of server {0} have been updated successfully",
		"Failed to update application commands of server {0}",
		[process.env.SERVER_ID]
	);
	replyInteraction = async (interaction, answer) => this.runAsync(
		() => interaction.reply(Object.assign(answer, {flags: Discord.MessageFlags.Ephemeral})),
		"Interaction has been replied successfully",
		"Failed to reply an interaction"
	);
	showModal = async (interaction, modal, userErrorMessage) => this.runAsync(
		() => interaction.showModal(modal),
		"Modal {0} (customId = {1}) has been shown successfully",
		"Failed to show modal {0} (customId = {1})",
		[modal.data.title, modal.data.custom_id],
		userErrorMessage
	);
	joinThread = async thread => this.runAsync(
		() => thread.join(),
		"Newly created thread {0} in channel {1} has been joined successfully",
		"Failed to join newly created thread {0} in channel {1}",
		[thread.name, thread.parent?.name]
	);
	addRoleToMember = async (member, roleId, userErrorMessage) => this.runAsync(
		() => member.roles.add(roleId),
		"Role with id {0} has been added to member {1} ({2}) successfully",
		"Failed to add role with id {0} to member {1} ({2})",
		[roleId, member.nickname ?? member.user.globalName, member.user.username],
		userErrorMessage
	);
};
