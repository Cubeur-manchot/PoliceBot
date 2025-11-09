"use strict";

import * as firebase from "firebase-admin/app";
import * as firestore from "firebase-admin/firestore";
import BotHelper from "./botHelper.js";

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
	constructor(bot) {
		super(bot);
		if (!firebase.getApps().length) {
			firebase.initializeApp({credential: firebase.applicationDefault()});
		}
		this.db = firestore.getFirestore();
		this.cache = Object.fromEntries(
			[...Object.keys(DataManager.collectionNames), DataManager.serverInfoDataType]
			.map(cacheKey => [cacheKey, {}])
		);
	};
	getData = async (dataType, keyName, keyValue, userErrorMessage) => this.cache[dataType][keyValue]
		??= dataType === DataManager.serverInfoDataType
			? await this.fetchServerInfo(keyValue, userErrorMessage)
			: await this.fetchFirestoreData(dataType, Object.fromEntries([[keyName, keyValue]]), null, userErrorMessage);
	addCache = (dataType, key, value) => {
		(this.cache[dataType][key] ??= []).push(value);
		this.logger.info(`Cache for data type "${dataType}" has been extended (key = "${key}", value = "${JSON.stringify(value)}") successfully.`);
	};
	replaceCache = (dataType, key, value) => {
		this.cache[dataType][key][0].data = value;
		this.logger.info(`Cache for data type "${dataType}" has been replaced (key = "${key}", value = "${JSON.stringify(value)}") successfully.`);
	};
	cleanCache = dataType => {
		this.cache[dataType] = {};
		this.logger.info(`Cache for data type "${dataType}" has been cleaned successfully.`);
	};
	fetchFirestoreData = async (collectionName, filters, fields, userErrorMessage) => {
		let query = this.db.collection(collectionName);
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
		return serverInfo.guild ? {id: parseInt(serverInfo.guild.id), name: serverInfo.guild.name} : null;
	};
	addFirestoreData = async (collectionName, key, newData, userErrorMessage) => {
		let addedDocument = await this.runAsync(
			() => this.db.collection(collectionName).add(newData),
			"New data {0} has been added to collection {1} successfully",
			"Failed to add new data {0} to collection {1}",
			[JSON.stringify(newData), collectionName],
			userErrorMessage
		);
		this.addCache(collectionName, key, {id: addedDocument.id, data: newData});
	};
	updateFirestoreData = async (collectionName, documentId, key, newData, userErrorMessage) => {
		await this.runAsync(
			() => this.db.collection(collectionName).doc(documentId).update(newData),
			"Document {0} in collection {1} has been updated with new data ({2}) successfully",
			"Failed to update document {0} in collection {1} with new data ({2})",
			[documentId, collectionName, JSON.stringify(newData)],
			userErrorMessage
		);
		this.replaceCache(collectionName, key, newData);
	};
	getServerWhiteListById = async (serverId, userErrorMessage) => (await this.getData(DataManager.collectionNames.serversWhiteList, "id", serverId, userErrorMessage))[0];
	addServerWhiteList = async (serverInfo, userErrorMessage) => await this.addFirestoreData(DataManager.collectionNames.serversWhiteList, serverInfo.id, serverInfo, userErrorMessage);
	updateServerWhiteList = async (documentId, serverInfo, userErrorMessage) => await this.updateFirestoreData(DataManager.collectionNames.serversWhiteList, documentId, serverInfo.id, serverInfo, userErrorMessage);
	getServerInfo = async (invitationId, userErrorMessage) => await this.getData(DataManager.serverInfoDataType, null, invitationId, userErrorMessage);
	addWarning = async (warningInfo, userErrorMessage) => await this.addFirestoreData(DataManager.collectionNames.warnings, warningInfo.userId, warningInfo, userErrorMessage);
};
