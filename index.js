"use strict";

const Discord = require("discord.js");

const {onReady, onMessage, onUserUpdate, onGuildMemberUpdate} = require("./eventHandler.js");

const PoliceBot = new Discord.Client();

PoliceBot.on("ready", () => onReady(PoliceBot));
PoliceBot.on("message", onMessage);
PoliceBot.on("messageUpdate", (oldMessage, newMessage) => onMessage(newMessage));
PoliceBot.on("userUpdate", onUserUpdate);
PoliceBot.on("guildMemberUpdate", onGuildMemberUpdate);

PoliceBot.login(process.env.TOKEN)
	.then(() => console.log("PoliceBot is logged in !"))
	.catch(console.error);
