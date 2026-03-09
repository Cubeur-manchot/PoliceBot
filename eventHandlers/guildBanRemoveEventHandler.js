"use strict";

import Discord from "discord.js";
import GuildBanEventHandler from "./guildBanEventHandler.js";

export default class GuildBanRemoveEventHandler extends GuildBanEventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.GuildBanRemove, "débanni");
	};
	handleEvent = async ban => {
		if (ban.guild.id !== process.env.SERVER_ID) {
			return;
		}
		let userId = ban.user.id;
		let activeBans;
		try {
		 	activeBans = await this.dataManager.getActiveBans(userId);
		} catch {
			this.logger.warn(`User ${userId} was unbanned, but an error occurred when fetching the ban information from the database or the cache.`);
		}
		let endTime = new Date();
		let banData;
		if (activeBans?.length) {
			let activeBan = this.getMostRecentActiveBan(activeBans);
			banData = {...activeBan.data, endTime};
			this.dataManager.updateBan(activeBan.id, banData);
		} else {
			banData = {userId, endTime};
			this.logger.warn(`User ${userId} was unbanned, but the ban information is missing from the database and the cache.`);
		}
		this.sendBanEmbedPoliceLog(banData, ban.user);
	};
	getMostRecentActiveBan = activeBans => activeBans.reduce((mostRecentBan, currentBan) => this.isTimestampGreater(currentBan.startTime, mostRecentBan.startTime) ? currentBan : mostRecentBan);
};
