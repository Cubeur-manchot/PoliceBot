"use strict";

const Discord = require("discord.js");

const {onReady, onMessage, onMessageUpdate, onUserUpdate, onGuildMemberUpdate, onGuildBanAdd, onGuildBanRemove} = require("./eventHandler.js");

const PoliceBot = new Discord.Client();

PoliceBot.on("ready", () => onReady(PoliceBot));
PoliceBot.on("message", onMessage);
PoliceBot.on("messageUpdate", onMessageUpdate);
PoliceBot.on("userUpdate", onUserUpdate);
PoliceBot.on("guildMemberUpdate", onGuildMemberUpdate);
PoliceBot.on("guildBanAdd", (guild, user) => onGuildBanAdd(user));
PoliceBot.on("guildBanRemove", (guild, user) => onGuildBanRemove(user));

PoliceBot.login(process.env.TOKEN)
	.then(() => console.log("PoliceBot is logged in !"))
	.catch(console.error);
