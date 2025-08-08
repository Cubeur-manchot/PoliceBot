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
	constructor(bot) {
		this.bot = bot;
		if (!firebase.getApps().length) {
			firebase.initializeApp({credential: firebase.applicationDefault()});
		}
		this.db = firestore.getFirestore();
		this.cache = Object.fromEntries([...Object.keys(DataManager.collectionNames), "serversInfo"].map(cacheKey => [cacheKey, {}]));
	};
	getDataByKey = async (collectionName, keyName, keyValue) => (this.cache[collectionName][keyValue] ??= await this.fetchData(collectionName, Object.fromEntries([[keyName, keyValue]]), null));
	fetchData = async (collectionName, filters, fields) => {
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
		} catch (getDataGetError) {
			this.bot.logger.error(`Error when querying database (collectionName = "${collectionName}", filters = "${JSON.stringify(filters)}", fields = "${JSON.stringify(fields)}") : "${getDataGetError}".`);
			throw getDataGetError;
		}
	};
	addData = async (collectionName, newData) => {
		try {
			await this.db.collection(collectionName).add(newData);
		} catch (addDataError) {
			this.bot.logger.error(`Error when adding new data to database (collectionName = "${collectionName}", new data = "${JSON.stringify(newData)}") : "${addDataError}".`);
			throw addErrorData
		};
	};
	updateData = async (collectionName, documentId, newData) => {
		try {
			await this.db.collection(collectionName).doc(documentId).update(newData);
		} catch (updateDataError) {
			this.bot.logger.error(`Error when updating data in database (collectionName = "${collectionName}", document id = "${documentId}", new data = "${JSON.stringify(newData)}") : "${updateDataError}".`);
		};
	};
	getServerWhiteListById = async serverId => (await this.getDataByKey(DataManager.collectionNames.serversWhiteList, "id", serverId))[0];
	addServerWhiteList = async serverInfo => await this.addData(DataManager.collectionNames.serversWhiteList, serverInfo);
	updateServerWhiteList = async (documentId, serverInfo) => await this.updateData(DataManager.collectionNames.serversWhiteList, documentId, serverInfo);
};
