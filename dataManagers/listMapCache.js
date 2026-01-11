"use strict";

import BotHelper from "../botHelper.js";

export default class ListMapCache extends BotHelper {
	#timer;
	#entryTimers;
	constructor(dataManager, dataType, expirationTimeMinutes = 1440, entryExpirationTimeMinutes) {
		super(dataManager.bot);
		this.dataType = dataType;
		this.expirationTimeMilliseconds = expirationTimeMinutes * 60 * 1000;
		if (entryExpirationTimeMinutes) {
			this.entryExpirationTimeMilliseconds = entryExpirationTimeMinutes * 60 * 1000;
			this.#entryTimers = new Map();
		}
		this.resetData(true); // Map<key, Array> containing either all values for a given key, or be empty (no partial lists)
	};
	resetData = (isInitialReset = false) => {
		this.data = new Map();
		if (!isInitialReset) {
			this.logger.info(`Cache for data type "${this.dataType}" has been reset successfully.`);
		}
		this.clearTimer();
	};
	updateExpiration = key => {
		if (this.expirationTimeMilliseconds) {
			this.clearTimer();
			this.#timer = setTimeout(() => this.resetData(), this.expirationTimeMilliseconds);
		}
		if (this.entryExpirationTimeMilliseconds) {
			if (key) {
				this.setEntryExpiration(key);
			} else {
				this.data.getKeys(() => true).forEach(this.setEntryExpiration);
			}
		}
	};
	setEntryExpiration = key => {
		this.#entryTimers.set(key, setTimeout(() => {
			this.removeEntry(key);
			this.#entryTimers.remove(key);
		}, this.entryExpirationTimeMilliseconds));
	};
	clearTimer = key => {
		clearTimeout(key ? this.#entryTimers.get(key) : this.#timer);
	};
	getEntries = keys => keys.map(key => this.data.get(key)).filter(Boolean).flat();
	getAllEntries = () => [...this.data.values()].flat();
	setEntries = map => {
		if (!(map instanceof Map)) {
			throw new Error(`Refused to set cache for data type "${this.dataType}", because the provided data is not a instance of map.`);
		}
		if ([...map.values()].some(value => !Array.isArray(value))) {
			throw new Error(`Refused to set cache for data type "${this.dataType}", because at least one of the values of the map is not an array.`);
		}
		this.data = map;
		this.updateExpiration();
		this.logger.info(`Cache for data type "${this.dataType}" has been set (${map.size} keys) successfully.`);
	};
	getEntry = key => this.data.get(key);
	setEntry = (key, list) => {
		if (this.data.has(key)) {
			this.replaceEntry(key, list);
		} else {
			this.addEntry(key, list);
		}
	};
	addEntry = (key, list) => {
		if (!Array.isArray(list)) {
			throw new Error(`Refused to add a new entry to the cache for data type "${this.dataType}", because the provided value is not an array.`);
		}
		if (this.data.has(key)) {
			throw new Error(`Refused to add a new entry to the cache for data type "${this.dataType}", because the cache already contains the key "${key}".`);
		}
		this.data.set(key, list);
		this.updateExpiration(key);
		this.logger.info(`Cache for data type "${this.dataType}" has been extended with new entry (key = "${key}", list = "${JSON.stringify(list)}") successfully.`);
	};
	replaceEntry = (key, list) => {
		if (!Array.isArray(list)) {
			throw new Error(`Refused to replace the entry in the cache for data type "${this.dataType}", because the provided value is not an array.`);
		}
		if (!this.data.has(key)) {
			throw new Error(`Refused to replace the entry in the cache for data type "${this.dataType}", because the cache does not contain the key "${key}".`);
		}
		this.data.set(key, list);
		this.updateExpiration(key);
		this.logger.info(`Cache entry for data type "${this.dataType}" has been updated (key = "${key}", list = "${JSON.stringify(list)}") successfully.`);
	};
	removeEntry = key => {
		if (!this.data.has(key)) {
			throw new Error(`Refused to remove the entry in the cache for data type "${this.dataType}", because the cache does not contain the key "${key}".`);
		}
		this.data.delete(key);
		this.clearTimer(key);
		this.logger.info(`Cache entry for data type "${this.dataType}" has been removed (key = "${key}") successfully.`);
	};
	pushToEntry = (key, value) => {
		if (!this.data.has(key)) {
			throw new Error(`Refused to push the value "${value}" to the entry in the cache for data type "${this.dataType}", because the cache does not contain the key "${key}".`);
		}
		this.data.get(key).push(value);
		this.updateExpiration(key);
		this.logger.info(`Cache entry for data type "${this.dataType}" has been extended (key = "${key}", new value = "${JSON.stringify(value)}") successfully.`);s
	};
	safePushToEntry = (key, value) => {
		if (!this.data.has(key)) {
			return; // do not create the key if it does not exist, because only full lists are allowed
		}
		this.data.get(key).push(value);
		this.updateExpiration(key);
		this.logger.info(`Cache entry for data type "${this.dataType}" has been extended (key = "${key}", new value = "${JSON.stringify(value)}") successfully.`);
	};
	getKeys = condition =>
		[...this.data]
		.filter(([_, value]) => condition(value))
		.map(([key, _]) => key);
};
