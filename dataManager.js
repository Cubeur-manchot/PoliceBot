"use strict";

import * as firebase from 'firebase-admin/app';
import * as firestore from 'firebase-admin/firestore';

export default class DataManager {
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
		this.bot = bot;
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
		try {
			let snapshot = await query.get();
			return snapshot.docs.map(document => ({id: document.id, data: document.data()}));
		} catch (fetchDataError) {
			this.bot.logger.error(`Error when querying database (collectionName = "${collectionName}", filters = "${JSON.stringify(filters)}", fields = "${JSON.stringify(fields)}") :`, fetchDataError);
			throw fetchDataError;
		}
	};
	fetchServerInfo = async invitationId => {
		let url = `https://discord.com/api/invites/${invitationId}`;
		let response;
		try {
			response = await fetch(
				`https://discord.com/api/invites/${invitationId}`,
				{
					headers: {
						"User-Agent": "PoliceBot (https://github.com/Cubeur-manchot/PoliceBot)",
						"Accept": "application/json"
					}
				}
			);
		} catch (fetchServerInfoError) {
			this.bot.logger.error(`Error while fetching Discord API (${url}) :`, fetchServerInfoError);
			throw fetchServerInfoError;
		}
		if (!response.ok) {
			this.bot.logger.error(`HTTP error while fetching Discord API (${url}) :`, response.status);
			return null;
		}
		try {
			let {guild} = await response.json();
			return guild ? {id: parseInt(guild.id), name: guild.name} : null;
		} catch (jsonError) {
			this.bot.logger.error(`Error while getting JSON data from Discord API response (${url}) :`, jsonError);
			return null;
		}
	};
	addFirestoreData = async (collectionName, newData) => {
		try {
			await this.db.collection(collectionName).add(newData);
		} catch (addDataError) {
			this.bot.logger.error(`Error when adding new data to database (collectionName = "${collectionName}", new data = "${JSON.stringify(newData)}") :`, addDataError);
			throw addDataError;
		};
	};
	updateFirestoreData = async (collectionName, documentId, newData) => {
		try {
			await this.db.collection(collectionName).doc(documentId).update(newData);
		} catch (updateDataError) {
			this.bot.logger.error(`Error when updating data in database (collectionName = "${collectionName}", document id = "${documentId}", new data = "${JSON.stringify(newData)}") :`, updateDataError);
			throw updateDataError;
		};
	};
	getServerWhiteListById = async serverId => (await this.getDataByKey(DataManager.collectionNames.serversWhiteList, "id", serverId))[0];
	addServerWhiteList = async serverInfo => await this.addFirestoreData(DataManager.collectionNames.serversWhiteList, serverInfo);
	updateServerWhiteList = async (documentId, serverInfo) => await this.updateFirestoreData(DataManager.collectionNames.serversWhiteList, documentId, serverInfo);
	getServerInfo = async invitationId => await this.getDataByKey(DataManager.serverInfoCollectionName, null, invitationId);
};
