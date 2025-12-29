"use strict";

import Discord from "discord.js";
import DiscordEmbedMessageBuilder from "../messageBuilders/discordEmbedMessageBuilder.js";
import EventHandler from "./eventHandler.js";

export default class InviteDeleteEventHandler extends EventHandler {
	constructor(eventManager) {
		super(eventManager, Discord.Events.InviteDelete);
	};
	handleEvent = async invite => {
		if (invite.guild?.id !== process.env.SERVER_ID) {
			return;
		}
		let inviteCreateEmbed = new DiscordEmbedMessageBuilder({
			color: DiscordEmbedMessageBuilder.colors.invite,
			title: "Invitation supprimée",
			description: `L'invitation dont le code est \`${invite.code}\` a été supprimée.`,
		});
		this.discordActionManager.sendInfoLogMessage({
			embeds: [inviteCreateEmbed.embed]
		});
	};
};
