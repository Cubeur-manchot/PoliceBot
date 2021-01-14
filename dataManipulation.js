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

const parseDate = dateString => new Date(
		dateString.substr(6, 4), // year
		dateString.substr(3, 2) - 1, // month
		dateString.substr(0,2), // day
		dateString.substr(11, 2), // hours
		dateString.substr(14,2), // minutes
		dateString.substr(17,2) // seconds
	);

const removeData = (argumentsString) => {
	let elementsIdToRemove = argumentsString.split(" ").filter(word => word !== "");
	let typesElementsSuccessfullyRemoved = [], failed = [];
	let policeBotData = readPoliceBotData();
	for (let elementIdToRemove of elementsIdToRemove) {
		if (/(i|w)#[0-9]+/.test(elementIdToRemove)) { // infraction or warn to remove
			let elementType = elementIdToRemove[0] === "i" ? "infractions" : "warns";
			let indexToRemove = policeBotData[elementType].findIndex(element => element.id === elementIdToRemove);
			if (indexToRemove === -1) { // id doesn't exist
				failed.push(elementIdToRemove);
			} else { // id exists, remove the infraction of warn
				policeBotData[elementType].splice(indexToRemove, 1);
				typesElementsSuccessfullyRemoved[elementType] = true;
			}
		} else if (/b#[0-9]+/.test(elementIdToRemove)) { // ban to remove
			// todo special case
		} else {
			failed.push(elementIdToRemove);
		}
	}
	writePoliceBotData(policeBotData); // update with modified data
	return {
		typesElementsSuccessfullyRemoved: typesElementsSuccessfullyRemoved,
		failed: failed
	}
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

module.exports = {readInfoData, writeInfoData, getAvailableId, getReadableDate, removeData, groupElementsByMemberId};
