"use strict";

import PoliceBot from "./policebot.js";

const bot = new PoliceBot(process.env.LOG_LEVELS.split(","), process.env.TOKEN);

process.on("SIGTERM", async () => {
	bot.logger.info("SIGTERM has been received, the application will stop.");
	await bot.shutDown();
	process.exit(0);
});

if (process.env.ENVIRONMENT === "development") {
	setTimeout( // auto-shutdown after timeout
		() => {
			bot.logger.info(`Development timeout of ${process.env.DEVELOPMENT_TIMEOUT_SECONDS} seconds is reached, the application will stop.`);
			process.exit(0);
		},
		parseInt(process.env.DEVELOPMENT_TIMEOUT_SECONDS) * 1000
	);
};

/*
const Discord = require("discord.js");

const {onMessage, onMessageUpdate, onMessageDelete, onUserUpdate, onGuildMemberUpdate, onGuildBanAdd, onGuildBanRemove} = require("./eventHandler.js");

const PoliceBot = new Discord.Client();

PoliceBot.on("message", onMessage);
PoliceBot.on("messageUpdate", onMessageUpdate);
PoliceBot.on("messageDelete", onMessageDelete);
PoliceBot.on("userUpdate", onUserUpdate);
PoliceBot.on("guildMemberUpdate", onGuildMemberUpdate);
PoliceBot.on("guildBanAdd", (guild, user) => onGuildBanAdd(user));
PoliceBot.on("guildBanRemove", (guild, user) => onGuildBanRemove(user));

*/
