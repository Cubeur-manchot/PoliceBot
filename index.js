"use strict";

/* console commands :
- initialize npm : npm init
- install discord.js : npm install --save discord.js
- install dotenv.js : npm install --save dotenv
- install pm2.js : npm install --save pm2
- install pm2-windows-startup : npm install --save pm2-windows-startup
- launch script via node : node index.js
- or launch script via pm2 : pm2 start index.js
*/

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
