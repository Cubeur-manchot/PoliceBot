"use strict";

import CommandHandler from "./commandHandler.js";

export default class OffTopicCommandHandler extends CommandHandler {
	static usersSelectionPromptMessage = "Veuillez sélectionner les utilisateurs ayant participé au HS dans <#{channelId}> depuis {startTime}.";
	static incorrectDateFormatErrorMessage = "Le format de date est incorrect. Veuillez entrer une date au format ISO";
	static fetchMessagesErrorMessage = "Une erreur s'est produite lors de la récupération des messages du salon";
	static bulkDeleteMessagesErrorMessage = "Une erreur s'est produite lors de la suppression des messages. Certains messages n'ont peut-être pas été supprimés";
	static bulkDeleteMessagesDeferMessage = ":wastebasket: {messageCount} messages vont être supprimés.";
	static bulkDeleteMessagesSuccessMessage = ":white_check_mark: {messageCount} messages ont été supprimés.";
	constructor(commandManager) {
		super(
			commandManager,
			"offtopic",
			{
				slash: true,
				user: false,
				message: true
			},
			"Déclare un hors-sujet commis par un ou plusieurs membres, et supprime les messages correspondants",
			[
				{
					name: "starttime",
					description: "Moment du début du HS au format ISO",
					required: true
				}
			]
		);
	};
	handleApplicationCommand = async interaction => {
		let startTime = this.getOffTopicStartTime(interaction);
		let channel = interaction.channel;
		let messagesGroupedByAuthor = await this.fetchMessagesFromDate(channel, startTime);
		this.dataManager.cacheMessagesByAuthorId(messagesGroupedByAuthor);
		let uniqueAuthorIds = [...messagesGroupedByAuthor.keys()];
		this.dataManager.cacheSelectedUsers(new Map(uniqueAuthorIds.map(userId => [userId, [true]])));
		let answer = this.buildDiscordMessageWithUsersSelectComponents(
			OffTopicCommandHandler.usersSelectionPromptMessage.replace("{channelId}", channel.id).replace("{startTime}", startTime.toISOString()),
			uniqueAuthorIds,
			this.commandName
		);
		return answer;
	};
	handleMessageComponent = async interaction => {
		if (interaction.isUserSelectMenu()) {
			return this.handleUserSelection(interaction);
		} else if (interaction.isButton()) {
			return this.handleValidateButtonClick(interaction);
		}
	};
	handleUserSelection = async interaction => {
		let selectedUsersMap = new Map(interaction.values.map(userId => [userId, [true]]));
		this.dataManager.cacheSelectedUsers(selectedUsersMap);
		return null;
	};
	handleValidateButtonClick = async interaction => {
		let selectedUserIds = this.dataManager.getCachedSelectedUsers();
		let messagesToDelete = this.dataManager.getCachedMessagesByAuthorIds(selectedUserIds);
		let messagesCount = messagesToDelete.length;
		this.dataManager.clearSelectedUsersCache();
		this.dataManager.clearMessagesCache();
		await this.discordActionManager.updateInteractionMessage(
			interaction,
			{
				content: OffTopicCommandHandler.bulkDeleteMessagesDeferMessage.replace("{messageCount}", messagesCount),
				components: []
			}
		);
		await this.discordActionManager.bulkDeleteMessages(interaction.channel, messagesToDelete, OffTopicCommandHandler.bulkDeleteMessagesErrorMessage);
		await this.discordActionManager.followUpInteraction(
			interaction,
			{content: OffTopicCommandHandler.bulkDeleteMessagesSuccessMessage.replace("{messageCount}", messagesCount)}
		);
		return null;
	};
	getOffTopicStartTime = interaction => {
		let startTime = new Date(
			interaction.isChatInputCommand()
				? this.parseCommandOptions(interaction.options).starttime
				: interaction.targetMessage.createdTimestamp
		);
		if (!isNaN(startTime.getTime())) {
			return startTime;
		} else {
			throw OffTopicCommandHandler.incorrectDateFormatErrorMessage;
		}
	};
	fetchMessagesFromDate = async (channel, startDate) => {
		let startTimestamp = startDate.getTime();
		let messagesGroupedByAuthor = new Map();
		let addMessageToGroupingMap = message => {
			let authorId = message.author.id;
			if (messagesGroupedByAuthor.has(authorId)) {
				messagesGroupedByAuthor.get(authorId).push(message);
			} else {
				messagesGroupedByAuthor.set(authorId, [message]);
			}
		};
		let beforeMessageId;
		for (let i = 0; i < 100; i++) { // safety limitation of 100 requests of 100 messages = 10000 messages in total
			let messages = await this.discordActionManager.fetchMessages(channel, beforeMessageId, OffTopicCommandHandler.fetchMessagesErrorMessage);
			let oldestMessage = messages.last();
			if (oldestMessage.createdTimestamp >= startTimestamp) { // all messages are more recent than startTimestamp
				messages.forEach(addMessageToGroupingMap);
			} else {
				for (let message of messages.values()) {
					if (message.createdTimestamp < startTimestamp) {
						return messagesGroupedByAuthor;
					}
					addMessageToGroupingMap(message);
				}
			}
			beforeMessageId = oldestMessage.id;
		}
		return messagesGroupedByAuthor;
	};
};
