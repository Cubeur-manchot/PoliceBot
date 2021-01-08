"use strict";

const fs = require("fs");

const readPoliceBotData = () =>
	JSON.parse(fs.readFileSync("./policeBotData.json"));

const readInfoData = infoType =>
	readPoliceBotData()[infoType];

const writePoliceBotData = policeBotDataObject =>
	fs.writeFileSync("./policeBotData.json", JSON.stringify(policeBotDataObject, null, "\t"));

const writeInfoData = (newData, infoType) => {
	let policeBotData = readPoliceBotData();
	policeBotData[infoType].push(newData);
	writePoliceBotData(policeBotData);
};

module.exports = {readInfoData, writeInfoData};
