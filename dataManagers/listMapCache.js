import BotHelper from "../botHelper.js";

export default class ListMapCache extends BotHelper {
	#data; // Map<key, Array> containing either all values for a given key, or be empty (no partial lists)
	#expirationTimeMilliseconds; // global expiration time
	#entryExpirationTimeMilliseconds; // expiration time for individual entries
	#timer; // timer for global expiration
	#entryTimers; // Map<key, timer> for individual entry expirations
	constructor(dataManager, {name: dataType, expirationTimeMinutes = 1440, entryExpirationTimeMinutes}) {
		super(dataManager.bot);
		this.dataType = dataType;
		this.#expirationTimeMilliseconds = expirationTimeMinutes * 60 * 1000;
		if (entryExpirationTimeMinutes) {
			this.#entryExpirationTimeMilliseconds = entryExpirationTimeMinutes * 60 * 1000;
			this.#entryTimers = new Map();
		}
		this.#initializeData();
	};
	// data
	#initializeData = () => {
		this.#data = new Map();
		this.logger.info(`Empty cache for data type "${this.dataType}" has been initialized successfully.`);
	};
	clearData = () => {
		this.#data.clear();
		this.#clearTimer();
		this.#clearEntryTimers();
		this.logger.info(`Cache for data type "${this.dataType}" has been cleared successfully.`);
	};
	// list of entries
	getAllEntries = () => [...this.#data.values()].flat();
	getEntries = keys => keys.map(key => this.#data.get(key)).filter(Boolean).flat();
	setEntries = map => {
		if (!(map instanceof Map)) {
			throw new Error(`Refused to set cache for data type "${this.dataType}", because the provided data is not a instance of map.`);
		}
		if ([...map.values()].some(value => !Array.isArray(value))) {
			throw new Error(`Refused to set cache for data type "${this.dataType}", because at least one of the values of the map is not an array.`);
		}
		this.#data = new Map(map);
		this.#setExpiration();
		this.#setEntryExpirations();
		this.logger.info(`Cache for data type "${this.dataType}" has been set (${map.size} keys) successfully.`);
	};
	// keys
	getKeys = condition => this.#data.entries().filter(([, list]) => condition(list)).map(([key]) => key).toArray();
	// individual entries
	getEntry = key => this.#data.get(key);
	setEntry = (key, list) => {
		if (!Array.isArray(list)) {
			throw new Error(`Refused to set an entry in the cache for data type "${this.dataType}", because the provided value is not an array.`);
		}
		this.#data.set(key, list);
		this.#setEntryExpiration(key);
		this.#setExpiration();
		this.logger.info(`Cache for data type "${this.dataType}" has been updated (action = ${this.#data.has(key) ? "replace" : "add"}) with new entry (key = "${key}", list = "${JSON.stringify(list)}") successfully.`);
	};
	removeEntry = key => {
		if (!this.#data.has(key)) {
			throw new Error(`Refused to remove the entry in the cache for data type "${this.dataType}", because the cache does not contain the key "${key}".`);
		}
		this.#data.delete(key);
		this.#clearEntryTimer(key);
		this.logger.info(`Cache entry for data type "${this.dataType}" has been removed (key = "${key}") successfully.`);
	};
	// entries content
	safePushToEntry = (key, value) => {
		if (!this.#data.has(key)) {
			return; // do not create the key if it does not exist, because only full lists are allowed
		}
		this.#data.get(key).push(value);
		this.#setEntryExpiration(key);
		this.#setExpiration();
		this.logger.info(`Cache entry for data type "${this.dataType}" has been extended (key = "${key}", new value = "${JSON.stringify(value)}") successfully.`);
	};
	// expirations
	#setExpiration = () => {
		if (this.#expirationTimeMilliseconds) {
			this.#clearTimer();
			this.#timer = setTimeout(() => this.clearData(), this.#expirationTimeMilliseconds);
		}
	};
	#setEntryExpirations = () => {
		if (this.#entryExpirationTimeMilliseconds) {
			this.#clearEntryTimers();
			this.#data.keys().forEach(this.#setEntryExpiration);
		}
	};
	#setEntryExpiration = key => {
		if (this.#entryExpirationTimeMilliseconds) {
			this.#clearEntryTimer(key);
			this.#entryTimers.set(key, setTimeout(() => this.removeEntry(key), this.#entryExpirationTimeMilliseconds));
		}
	};
	// timers
	#clearTimer = () => clearTimeout(this.#timer);
	#clearEntryTimers = () => {
		this.#entryTimers?.forEach(clearTimeout);
		this.#entryTimers?.clear();
	};
	#clearEntryTimer = key => {
		clearTimeout(this.#entryTimers?.get(key));
		this.#entryTimers?.delete(key);
	};
};
