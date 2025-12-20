"use strict";

import * as firebase from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";
import BotHelper from "../botHelper.js";
import ListMapCache from "./listMapCache.js";

export default class DataManager extends BotHelper {
	static collectionNames = {
		bans: "bans",
		channels: "channels",
		discussions: "discussions",
		infractions: "infractions",
		serversWhiteList: "serversWhiteList",
		warnings: "warnings"
	};
	static serverInfoDataType = "serversInfo";
	static discordMessagesDataType = "discordMessages";
	static discordMembersCurrentSelectionDataType = "discordMembersCurrentSelection";
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
			[
				...Object.values(DataManager.collectionNames).map(dataType => new ListMapCache(this, dataType)),
				new ListMapCache(this, DataManager.serverInfoDataType),
				new ListMapCache(this, DataManager.discordMessagesDataType, 15),
				new ListMapCache(this, DataManager.discordMembersCurrentSelectionDataType, 15)
			],
			"dataType"
		);
	};
	getData = async options => {
		let {dataType, keyName, keyValue, userErrorMessage} = options;
		let cachedValue = this.cache[dataType].getEntry(keyValue);
		if (cachedValue) {
			return cachedValue;
		};
		let fetchedValue = dataType === DataManager.serverInfoDataType
			? await this.fetchServerInfo(keyValue, userErrorMessage)
			: await this.fetchFirestoreData(dataType, Object.fromEntries([[keyName, keyValue]]), null, userErrorMessage);
		this.cache[dataType].addEntry(keyValue, fetchedValue);
		return fetchedValue;
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
			this.logger.error(`HTTP error while fetching Discord API (${url}) :`, response.status);
			throw userErrorMessage;
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
		this.cache[collectionName].safePushToEntry(key, {id: addedDocument.id, data: newData});
	};
	addBatchFirestoreData = async (collectionName, elements, keyName, userErrorMessage) => {
		let batch = this.database.batch();
		let collection = this.database.collection(collectionName);
		for (let element of elements) {
			let documentId = collection.doc();
			batch.set(documentId, element);
			this.cache[collectionName].safePushToEntry(element[keyName], {id: documentId, data: element});
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
		this.cache[collectionName].removeEntry(key);
	};
	getServerWhiteListById = async (serverId, userErrorMessage) => (await this.getData({dataType: DataManager.collectionNames.serversWhiteList, keyName: "id", keyValue: serverId, userErrorMessage}))[0];
	addServerWhiteList = async (serverInfo, userErrorMessage) => await this.addFirestoreData(DataManager.collectionNames.serversWhiteList, serverInfo.id, serverInfo, userErrorMessage);
	updateServerWhiteList = async (documentId, serverInfo, userErrorMessage) => await this.updateFirestoreData(DataManager.collectionNames.serversWhiteList, documentId, serverInfo.id, serverInfo, userErrorMessage);
	getServerInfo = async (invitationId, userErrorMessage) => await this.getData({dataType: DataManager.serverInfoDataType, keyValue: invitationId, userErrorMessage})[0];
	addWarning = async (warningInfo, userErrorMessage) => await this.addFirestoreData(DataManager.collectionNames.warnings, warningInfo.userId, warningInfo, userErrorMessage);
	addInfractions = async (infractions, userErrorMessage) => await this.addBatchFirestoreData(DataManager.collectionNames.infractions, infractions, "userId", userErrorMessage);
	getCachedMessagesByAuthorIds = authorIdList => this.cache[DataManager.discordMessagesDataType].getEntries(authorIdList);
	cacheMessagesByAuthorId = map => this.cache[DataManager.discordMessagesDataType].setEntries(map);
	clearMessagesCache = () => this.cache[DataManager.discordMessagesDataType].resetData();
	getCachedSelectedUsers = () => this.cache[DataManager.discordMembersCurrentSelectionDataType].getKeys(list => list[0] === true);
	cacheSelectedUsers = map => this.cache[DataManager.discordMembersCurrentSelectionDataType].setEntries(map);
	clearSelectedUsersCache = () => this.cache[DataManager.discordMembersCurrentSelectionDataType].resetData();
};
