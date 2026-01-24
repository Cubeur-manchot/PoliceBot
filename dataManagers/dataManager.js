"use strict";

import * as firebase from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";
import BotHelper from "../botHelper.js";
import ListMapCache from "./listMapCache.js";

export default class DataManager extends BotHelper {
	static dataTypeTypes = {
		collection: "collection",
		cache: "cache",
		hydrated: "hydrated"
	};
	static dataTypes = {
		bans: {name: "bans", type: DataManager.dataTypeTypes.collection},
		channels: {name: "channels", type: DataManager.dataTypeTypes.collection},
		infractions: {name: "infractions", type: DataManager.dataTypeTypes.collection},
		prisons: {name: "prisons", type: DataManager.dataTypeTypes.collection},
		serversWhitelist: {name: "serversWhitelist", type: DataManager.dataTypeTypes.collection},
		warnings: {name: "warnings", type: DataManager.dataTypeTypes.collection},
		discordMembersCurrentSelection: {name: "discordMembersCurrentSelection", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: 15},
		discordMessages: {name: "discordMessages", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: 15},
		pinnedMessages: {name: "pinnedMessages", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: null},
		messageAttachments: {name: "messageAttachments", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: null, entryExpirationTimeMinutes: 1440},
		messageMentions: {name: "messageMentions", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: null, entryExpirationTimeMinutes: 1440},
		inviteUsages: {name: "inviteUsages", type: DataManager.dataTypeTypes.cache, expirationTimeMinutes: null},
		servers: {name: "servers", type: DataManager.dataTypeTypes.hydrated},
	};
	constructor(bot) {
		super(bot);
		this.initializeDatabase();
		this.initializeCache();
	};
	initializeDatabase = () => {
		if (!firebase.getApps().length) {
			firebase.initializeApp({credential: firebase.applicationDefault()});
		}
		this.database = firestore.getFirestore();
	};
	initializeCache = () => {
		this.cache = this.dictionnize(
			Object.values(DataManager.dataTypes)
				.map(dataType => new ListMapCache(this, dataType)),
			"dataType"
		);
		this.logger.info(`Cache has been set for ${this.cache.size} data types successfully.`)
	};
	getData = async options => {
		let {dataType, keyName, keyValue, additionalFilters, userErrorMessage, hydrateFunction} = options;
		let cachedValue = this.cache.get(dataType).getEntry(keyValue);
		if (cachedValue) {
			return cachedValue;
		};
		let fetchedValue = dataType === DataManager.dataTypes.servers.name
			? await this.fetchServerInfo(keyValue, userErrorMessage)
			: await this.fetchFirestoreData(dataType, {...Object.fromEntries([[keyName, keyValue]]), ...additionalFilters}, null, userErrorMessage);
		let returnValue = hydrateFunction
			? await Promise.all(fetchedValue.map(async element => ({id: element.id, data: await hydrateFunction(element.data)})))
			: fetchedValue;
		this.cache.get(dataType).addEntry(keyValue, returnValue);
		return returnValue;
	};
	fetchFirestoreData = async (collectionName, filters, fields, userErrorMessage) => {
		let query = this.database.collection(collectionName);
		for (let [field, value] of Object.entries(filters)) {
			query = query.where(field, "==", value);
		}
		if (fields) {
			query = query.select(...fields);
		}
		return (
			await this.runAsync(
				() => query.get(),
				"Collection {0} has been fetched with filters {1} and fields {2} successfully",
				"Failed to fetch collection {0} with filters {1} and fields {2}",
				[collectionName, JSON.stringify(filters), JSON.stringify(fields)],
				userErrorMessage
			)
		).docs.map(document => ({id: document.id, data: document.data()}));
	};
	fetchServerInfo = async (invitationId, userErrorMessage) => {
		let url = `https://discord.com/api/invites/${invitationId}`;
		let response = await this.runAsync(
			() => fetch(`https://discord.com/api/invites/${invitationId}`,
				{
					headers: {
						"User-Agent": "PoliceBot (https://github.com/Cubeur-manchot/PoliceBot)",
						"Accept": "application/json"
					}
				}
			),
			"Discord API ({0}) has been fetched successfully",
			"Failed to fetch Discord API ({0})",
			[url],
			userErrorMessage
		);
		if (!response.ok) {
			let errorMessage = `HTTP error while fetching Discord API (${url}) : ${response.status}.`;
			if (response.status === 404) {
				this.logger.warn(errorMessage);
			} else {
				this.logger.error(errorMessage);
			}
			throw userErrorMessage ?? errorMessage;
		}
		let serverInfo = await this.runAsync(
			() => response.json(),
			"JSON data from Discord API response has been extracted successfully",
			"Failed to extract JSON data from Discord API response",
			[],
			userErrorMessage
		);
		return serverInfo.guild
			? [{
				id: null, // such element do not have a documentId like in Firestore database
				data: {id: parseInt(serverInfo.guild.id), name: serverInfo.guild.name}
			}]
			: [];
	};
	addFirestoreData = async (collectionName, key, newData, userErrorMessage) => {
		let addedDocument = await this.runAsync(
			() => this.database.collection(collectionName).add(newData),
			"New data {0} has been added to collection {1} successfully",
			"Failed to add new data {0} to collection {1}",
			[JSON.stringify(newData), collectionName],
			userErrorMessage
		);
		this.cache.get(collectionName).safePushToEntry(key, {id: addedDocument.id, data: newData});
	};
	addBatchFirestoreData = async (collectionName, elements, keyName, userErrorMessage) => {
		let batch = this.database.batch();
		let collection = this.database.collection(collectionName);
		for (let element of elements) {
			let documentId = collection.doc();
			batch.set(documentId, element);
			this.cache.get(collectionName).safePushToEntry(element[keyName], {id: documentId, data: element});
		}
		await this.runAsync(
			() => batch.commit(),
			"Batch data of {0} elements has been added to collection {1} successfully",
			"Failed to add batch data of {0} elements to collection {1}",
			[elements.length, collectionName],
			userErrorMessage
		);
	};
	updateFirestoreData = async (collectionName, documentId, key, newData, userErrorMessage) => {
		await this.runAsync(
			() => this.database.collection(collectionName).doc(documentId).update(newData),
			"Document {0} in collection {1} has been updated with new data ({2}) successfully",
			"Failed to update document {0} in collection {1} with new data ({2})",
			[documentId, collectionName, JSON.stringify(newData)],
			userErrorMessage
		);
		this.cache.get(collectionName).removeEntry(key);
	};
	getLogChannel = async nature => (await this.getData(
		{
			dataType: DataManager.dataTypes.channels.name,
			keyName: "nature",
			keyValue: nature,
			additionalFilters: {environment: process.env.ENVIRONMENT},
			hydrateFunction: async channelInfo => await this.bot.discordClientManager.discordActionManager.fetchChannel(channelInfo.id)
		}
	))[0];
	getServerInfo = async (invitationId, userErrorMessage) => (await this.getData(
		{
			dataType: DataManager.dataTypes.servers.name,
			keyName: "invitationId",
			keyValue: invitationId,
			hydrateFunction: async serverInfo => ({...serverInfo, isWhitelisted: await this.isServerWhitelisted(serverInfo.id, userErrorMessage)}),
			userErrorMessage
		}
	))[0];
	isServerWhitelisted = async (serverId, userErrorMessage) => (await this.getData(
		{
			dataType: DataManager.dataTypes.serversWhitelist.name,
			keyName: "id",
			keyValue: serverId,
			userErrorMessage
		}
	)).length !== 0;
	addServerWhitelist = async (serverInfo, inviteId, userErrorMessage) => {
		await this.addFirestoreData(DataManager.dataTypes.serversWhitelist.name, serverInfo.id, serverInfo, userErrorMessage);
		await this.cache.get(DataManager.dataTypes.servers.name).replaceEntry( // update second cache type because this collection is used in hydration but not directly queried
			inviteId,
			this.cache.get(DataManager.dataTypes.servers.name).getEntry(inviteId).map(element => ({
				id: element.id,
				data: {...element.data, isWhitelisted: true}
			}))
		);
	};
	buildInvitesCache = async () => {
		let invites = await this.bot.discordClientManager.discordActionManager.fetchInvites();
		this.cacheInviteUsages(invites);
	};
	cacheInviteUsages = invites => {
		let reducedInvites = invites.map(invite => ({
			code: invite.code,
			inviter: {id: invite.inviter.id, username: invite.inviter.username},
			channel: {id: invite.channel.id, name: invite.channel.name},
			createdTimestamp: invite.createdTimestamp,
			expiresTimestamp: invite.expiresTimestamp,
			uses: invite.uses,
			maxUses: invite.maxUses
		}));
		let invitesMap = this.dictionnizeArray(reducedInvites, "code");
		this.cache.get(DataManager.dataTypes.inviteUsages.name).setEntries(invitesMap);
	};
	buildPinnedMessagesCache = async isInitialFetch => {
		let textChannels = (await this.bot.discordClientManager.discordActionManager.fetchChannels())
			.filter(channel => channel.isTextBased()); // voice channels cannot have pinned messages in their text discussion
		let pinnedMessagesMap = new Map(
			await Promise.all(textChannels.map(async channel => [
				channel.id,
				this.reducePinnedMessages(await this.bot.discordClientManager.discordActionManager.fetchPinnedMessages(channel, isInitialFetch))
			]))
		);
		this.cache.get(DataManager.dataTypes.pinnedMessages.name).setEntries(pinnedMessagesMap);
	};
	cachePinnedMessages = (channelId, pinnedMessages) => {
		let reducedMessages = this.reducePinnedMessages(pinnedMessages);
		this.cache.get(DataManager.dataTypes.pinnedMessages.name).setEntry(channelId, reducedMessages);
	};
	reducePinnedMessages = pinnedMessages => pinnedMessages.map(pinnedMessage => ({
		pinnedTimestamp: pinnedMessage.pinnedTimestamp,
		message: {
			id: pinnedMessage.message.id,
			channelId: pinnedMessage.message.channelId,
			createdTimestamp: pinnedMessage.message.createdTimestamp,
			content: pinnedMessage.message.content,
			author: pinnedMessage.message.author,
			url: pinnedMessage.message.url,
			embeds: pinnedMessage.message.embeds,
			attachments: pinnedMessage.message.attachments,
			components: pinnedMessage.message.components,
			editedTimestamp: pinnedMessage.message.editedTimestamp
		}
	}))
	getCachedPinnedMessages = channelId => this.cache.get(DataManager.dataTypes.pinnedMessages.name).getEntry(channelId);
	getAllCachedInviteUsages = () => this.cache.get(DataManager.dataTypes.inviteUsages.name).getAllEntries();
	addBan = async banInfo => await this.addFirestoreData(DataManager.dataTypes.bans.name, banInfo.userId, banInfo);
	getBans = async (userId, userErrorMessage) => await this.getData({dataType: DataManager.dataTypes.bans.name, keyName: "userId", keyValue: userId, userErrorMessage});
	getActiveBans = async userId => await this.getData({dataType: DataManager.dataTypes.bans.name, keyName: "userId", keyValue: userId, additionalFilters: {endTime: null}});
	updateBan = async (documentId, newData) => await this.updateFirestoreData(DataManager.dataTypes.bans.name, documentId, newData.userId, newData);
	addWarning = async (warningInfo, userErrorMessage) => await this.addFirestoreData(DataManager.dataTypes.warnings.name, warningInfo.userId, warningInfo, userErrorMessage);
	getWarnings = async (userId, userErrorMessage) => await this.getData({dataType: DataManager.dataTypes.warnings.name, keyName: "userId", keyValue: userId, userErrorMessage});
	addPrison = async prisonInfo => await this.addFirestoreData(DataManager.dataTypes.prisons.name, prisonInfo.userId, prisonInfo);
	getPrisons = async (userId, userErrorMessage) => await this.getData({dataType: DataManager.dataTypes.prisons.name, keyName: "userId", keyValue: userId, userErrorMessage});
	getActivePrisons = async userId => await this.getData({dataType: DataManager.dataTypes.prisons.name, keyName: "userId", keyValue: userId, additionalFilters: {endTime: null}});
	updatePrison = async (documentId, newData) => await this.updateFirestoreData(DataManager.dataTypes.prisons.name, documentId, newData.userId, newData);
	addInfractions = async (infractions, userErrorMessage) => await this.addBatchFirestoreData(DataManager.dataTypes.infractions.name, infractions, "userId", userErrorMessage);
	getInfractions = async (userId, userErrorMessage) => await this.getData({dataType: DataManager.dataTypes.infractions.name, keyName: "userId", keyValue: userId, userErrorMessage});
	getCachedMessagesByAuthorIds = authorIdList => this.cache.get(DataManager.dataTypes.discordMessages.name).getEntries(authorIdList);
	cacheMessagesByAuthorId = map => this.cache.get(DataManager.dataTypes.discordMessages.name).setEntries(map);
	clearMessagesCache = () => this.cache.get(DataManager.dataTypes.discordMessages.name).resetData();
	getCachedSelectedUsers = () => this.cache.get(DataManager.dataTypes.discordMembersCurrentSelection.name).getKeys(list => list[0] === true);
	cacheSelectedUsers = map => this.cache.get(DataManager.dataTypes.discordMembersCurrentSelection.name).setEntries(map);
	clearSelectedUsersCache = () => this.cache.get(DataManager.dataTypes.discordMembersCurrentSelection.name).resetData();
	getCachedMessageAttachments = messageId => this.cache.get(DataManager.dataTypes.messageAttachments.name).getEntry(messageId);
	cacheMessageAttachments = (messageId, attachments) => this.cache.get(DataManager.dataTypes.messageAttachments.name).setEntry(messageId, attachments);
	getCachedMessageMentions = messageId => this.cache.get(DataManager.dataTypes.messageMentions.name).getEntry(messageId);
	cacheMessageMentions = (messageId, mentions) => this.cache.get(DataManager.dataTypes.messageMentions.name).setEntry(messageId, mentions);
};
