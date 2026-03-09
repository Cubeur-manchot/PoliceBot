"use strict";

import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class GuildBanRemoveEventHandler extends EventHandler {
	constructor(eventManager, event, action) {
		super(eventManager, event);
		this.action = action;
	};
	sendBanEmbedPoliceLog = (banData, user) => {
		let banEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.ban,
			title: `Un membre a été ${this.action}`,
			thumbnailUrl: user.displayAvatarURL(),
			description: `Le compte <@${banData.userId}> (@${user.username}) a été débanni.`,
			fields: [
				{name: "Date de début", value: banData.startTime ? this.formatDate(banData.startTime) : "(impossible à déterminer)", inline: true},
				{name: "Date de fin", value: banData.endTime ? this.formatDate(banData.endTime) : "(pas de date de fin)", inline: true},
				{name: "Motif", value: banData.reason ?? "(impossible à déterminer)", inline: true}
			]
		});
		this.discordActionManager.sendPoliceLogMessage({
			embeds: [banEmbed.embed]
		});
	};
};
