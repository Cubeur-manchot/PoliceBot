"use strict";

import Discord from "discord.js";
import BotHelper from "./botHelper.js";

export default class DiscordActionManager extends BotHelper {
	constructor(discordClientManager) {
		super(discordClientManager.bot);
		this.discordClientManager = discordClientManager;
		this.discordClient = discordClientManager.discordClient;
	};
	setActivePresence = () => {
		this.discordClient.user.setPresence({status: "online", activities: [{type: Discord.ActivityType.Playing, name: "surveiller Cubeurs Francophones"}]});
		this.logger.info("Presence has been set to active.");
	};
	setInactivePresence = () => {
		this.discordClient.user.setPresence({status: "idle", activities: [{type: Discord.ActivityType.Playing, name: "faire la sieste 😴"}]});
		this.logger.info("Presence has been set to inactive.");
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
	deferUpdateInteraction = async interaction => this.runAsync(
		() => interaction.deferUpdate(),
		"Interaction has been defer updated successfully",
		"Failed to defer update an interaction"
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
	fetchMessages = async (channel, beforeMessageId, userErrorMessage) => this.runAsync(
		() => channel.messages.fetch({limit: 100, ...(beforeMessageId && {before: beforeMessageId})}),
		"Messages were fetched in channel {0} before message with id {1} successfully",
		"Failed to fetch messages in channel {0} before message with id {1}",
		[channel.name, beforeMessageId],
		userErrorMessage
	);
	bulkDeleteMessages = async (channel, messagesToDelete, userErrorMessage) => {
		let bulkDeletes = await Promise.allSettled(
			Array.from(
				{length: Math.ceil(messagesToDelete.length / 100)},
				(_, index) => this.bulkDeleteMessagesBatch(channel, messagesToDelete.slice(index * 100, (index + 1) * 100))
			)
		);
		if (bulkDeletes.some(bulkDelete => bulkDelete.status === "rejected")) {
			throw userErrorMessage;
		}
	};
	bulkDeleteMessagesBatch = async (channel, messagesToDelete) => this.runAsync(
		() => channel.bulkDelete(messagesToDelete),
		"{0} messages in channel {1} have been bulk deleted successfully",
		"Failed to bulk delete {0} messages in channel {1}",
		[messagesToDelete.length, channel.name]
	);
};
