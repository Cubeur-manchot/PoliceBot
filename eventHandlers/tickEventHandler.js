"use strict";

import EventHandler from "./eventHandler.js";

export default class TickEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, "tick");
		this.retentionTimeMilliseconds = parseInt(process.env.LOG_INFO_RENTENTION_DURATION_DAYS) * 24 * 60 * 60 * 1000;
	};
	handleEvent = async () => {
		let infoLogChannel = (await this.dataManager.getLogChannel("infoLog")).data;
		let messagesToDelete;
		try {
			messagesToDelete = await this.discordActionManager.fetchMessagesBeforeTimestamp(infoLogChannel, new Date().getTime() - this.retentionTimeMilliseconds);
		} catch (messagesFetchError) {
			this.logger.error("Cannot get old info log messages to delete.", messagesFetchError);
			messagesToDelete = [];
		}
		try {
			this.discordActionManager.bulkDeleteMessages(infoLogChannel, messagesToDelete);
		} catch (bulkDeleteError) {
			this.logger.error("Cannot delete all old info log messages.", error);
		}
	};
};
