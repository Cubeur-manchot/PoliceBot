"use strict";

import BotHelper from "./botHelper.js";
import ChannelPinsUpdateEventHandler from "./eventHandlers/channelPinsUpdateEventHandler.js";
import ClientReadyEventHandler from "./eventHandlers/clientReadyEventHandler.js";
import GuildBanAddEventHandler from "./eventHandlers/guildBanAddEventHandler.js";
import GuildBanRemoveEventHandler from "./eventHandlers/guildBanRemoveEventHandler.js";
import GuildMemberAddEventHandler from "./eventHandlers/guildMemberAddEventHandler.js";
import GuildMemberUpdateEventHandler from "./eventHandlers/guildMemberUpdateEventHandler.js";
import InteractionCreateEventHandler from "./eventHandlers/interactionCreateEventHandler.js";
import InviteCreateEventHandler from "./eventHandlers/inviteCreateEventHandler.js";
import InviteDeleteEventHandler from "./eventHandlers/inviteDeleteEventHandler.js";
import MessageCreateEventHandler from "./eventHandlers/messageCreateEventHandler.js";
import MessageDeleteEventHandler from "./eventHandlers/messageDeleteEventHandler.js";
import MessageUpdateEventHandler from "./eventHandlers/messageUpdateEventHandler.js";
import ThreadCreateEventHandler from "./eventHandlers/threadCreateEventHandler.js";
import UserUpdateEventHandler from "./eventHandlers/userUpdateEventHandler.js";

export default class DiscordEventManager extends BotHelper {
	constructor(discordClientManager) {
		super(discordClientManager.bot);
		this.discordClientManager = discordClientManager;
		this.discordClient = discordClientManager.discordClient;
		let eventHandlers = [
			new ChannelPinsUpdateEventHandler(this),
			new ClientReadyEventHandler(this),
			new GuildBanAddEventHandler(this),
			new GuildBanRemoveEventHandler(this),
			new GuildMemberAddEventHandler(this),
			new GuildMemberUpdateEventHandler(this),
			new InteractionCreateEventHandler(this),
			new InviteCreateEventHandler(this),
			new InviteDeleteEventHandler(this),
			new MessageCreateEventHandler(this),
			new MessageDeleteEventHandler(this),
			new MessageUpdateEventHandler(this),
			new ThreadCreateEventHandler(this),
			new UserUpdateEventHandler(this)
		];
		this.eventHandlers = this.dictionnize(eventHandlers, "eventName");
		eventHandlers.forEach(eventHandler => eventHandler.attachEventToClient());
	};
};
