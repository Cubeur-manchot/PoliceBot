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
		warns: "warns"
	};
	static serverInfoCollectionName = "serversInfo";
	constructor(bot) {
		super(bot);
		if (!firebase.getApps().length) {
			firebase.initializeApp({credential: firebase.applicationDefault()});
		}
		this.db = firestore.getFirestore();
		this.cache = Object.fromEntries([...Object.keys(DataManager.collectionNames), DataManager.serverInfoCollectionName].map(cacheKey => [cacheKey, {}]));
	};
	getDataByKey = async (collectionName, keyName, keyValue) => this.cache[collectionName][keyValue]
		??= collectionName === DataManager.serverInfoCollectionName
			? await this.fetchServerInfo(keyValue)
			: await this.fetchFirestoreData(collectionName, Object.fromEntries([[keyName, keyValue]]), null);
	fetchFirestoreData = async (collectionName, filters, fields) => {
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
				[collectionName, JSON.stringify(filters), JSON.stringify(fields)]
			)
		).docs.map(document => ({id: document.id, data: document.data()}));
	};
	fetchServerInfo = async invitationId => {
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
			[url]
		);
		if (!response.ok) {
			this.logger.error(`HTTP error while fetching Discord API (${url}) :`, response.status);
			return null;
		}
		let serverInfo = await this.runAsync(
			() => response.json(),
			"JSON data from Discord API response has been extracted successfully",
			"Failed to extract JSON data from Discord API response"
		);
		return serverInfo.guild ? {id: parseInt(serverInfo.guild.id), name: serverInfo.guild.name} : null;
	};
	addFirestoreData = async (collectionName, newData) => this.runAsync(
		() => this.db.collection(collectionName).add(newData),
		"New data {0} has been added to collection {1} successfully",
		"Failed to add new data {0} to collection {1}",
		[JSON.stringify(newData), collectionName]
	);
	updateFirestoreData = async (collectionName, documentId, newData) => this.runAsync(
		() => this.db.collection(collectionName).doc(documentId).update(newData),
		"Document {0} in collection {1} has been updated with new data ({2}) successfully",
		"Failed to update document {0} in collection {1} with new data ({2})",
		[documentId, collectionName, JSON.stringify(newData)]
	);
	getServerWhiteListById = async serverId => (await this.getDataByKey(DataManager.collectionNames.serversWhiteList, "id", serverId))[0];
	addServerWhiteList = async serverInfo => await this.addFirestoreData(DataManager.collectionNames.serversWhiteList, serverInfo);
	updateServerWhiteList = async (documentId, serverInfo) => await this.updateFirestoreData(DataManager.collectionNames.serversWhiteList, documentId, serverInfo);
	getServerInfo = async invitationId => await this.getDataByKey(DataManager.serverInfoCollectionName, null, invitationId);
};
