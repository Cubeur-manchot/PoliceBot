"use strict";

import Discord from "discord.js";
import GuildBanEventHandler from "./guildBanEventHandler.js";

export default class GuildBanAddEventHandler extends GuildBanEventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.GuildBanAdd, "banni");
	};
	handleEvent = async ban => {
		if (ban.guild.id !== process.env.SERVER_ID) {
			return;
		}
		let userId = ban.user.id;
		let reason;
		try {
			let fetchedBan = await this.discordActionManager.fetchBan(userId);
			reason = fetchedBan.reason ?? "(non spécifiée)";
		} catch {
			reason = "(impossible à déterminer)";
		}
		let startTime = new Date();
		this.sendBanEmbedPoliceLog({userId, startTime, reason}, ban.user);
		this.dataManager.addBan({userId, reason, startTime, endTime: null});
	};
};
