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

const getAvailableId = infoType => {
	let dataOfThisType = readInfoData(infoType);
	let idWithoutIncrement = infoType[0].toLowerCase() + "#";
	for (let increment = 1; increment < 100; increment++) {
		if (!dataOfThisType.find(dataInstance => dataInstance.id === idWithoutIncrement + increment)) { // id is free
			return idWithoutIncrement + increment;
		}
	}
};

const getReadableDate = date => {
	return (date.getDate() < 10 ? "0" : "") + date.getDate()
		+ "/" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)
		+ "/" + date.getFullYear()
		+ " " + (date.getHours() < 10 ? "0" : "") + date.getHours()
		+ ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes()
		+ ":" + (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
};

module.exports = {readInfoData, writeInfoData, getAvailableId, getReadableDate};
