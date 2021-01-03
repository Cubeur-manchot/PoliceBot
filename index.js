"use strict";

const Discord = require("discord.js");
require("dotenv").config();

const {onReady, onMessage, onMessageUpdate, onMessageDelete} = require("./eventHandler.js");

const PoliceBot = new Discord.Client();

PoliceBot.on("ready", () => onReady(PoliceBot));
PoliceBot.on("message", onMessage);
PoliceBot.on("messageUpdate", onMessageUpdate);
PoliceBot.on("messageDelete", onMessageDelete);

PoliceBot.login(process.env.TOKEN)
	.then(() => console.log("PoliceBot is logged in !"))
	.catch(console.error);
