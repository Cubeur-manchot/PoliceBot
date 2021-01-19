"use strict";

const fs = require("fs");

const readPoliceBotData = () =>
	JSON.parse(fs.readFileSync("./policeBotData.json"));

const readInfoData = infoType =>
	readPoliceBotData()[infoType];

const writePoliceBotData = policeBotDataObject =>
	fs.writeFileSync("./policeBotData.json", JSON.stringify(policeBotDataObject, null, "\t"));

const addInfoData = (newData, infoType) => {
	let policeBotData = readPoliceBotData();
	policeBotData[infoType].push(newData);
	writePoliceBotData(policeBotData);
};

const writeInfoData = (newData, infoType) => {
	let policeBotData = readPoliceBotData();
	policeBotData[infoType] = newData;
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

const removePoliceBotData = (infoType, indexOfElement) => {
	let dataOfThisType = readInfoData(infoType);
	dataOfThisType.splice(indexOfElement, 1);
	writeInfoData(dataOfThisType, infoType);
};

const infoTypeFromIdFirstLetter = {
	i: "infractions",
	w: "warns",
	b: "bans"
};

const groupElementsByMemberId = elementsArray => {
	let result = [];
	for (let element of elementsArray) {
		if (result[element.memberId]) { // member already has some elements, simply add the new one
			result[element.memberId].push(element);
		} else { // member has no element, create new array
			result[element.memberId] = [element];
		}
	}
	return result;
};

module.exports = {readInfoData, addInfoData, writeInfoData, readPoliceBotData, removePoliceBotData, getAvailableId, groupElementsByMemberId, infoTypeFromIdFirstLetter};
