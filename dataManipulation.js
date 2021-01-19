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

const infoTypeFromIdFirstLetter = {
	i: "infractions",
	w: "warns",
	b: "bans"
};

const removeElement = argumentsString => {
	let elementsIdToRemove = argumentsString.split(" ").filter(word => word !== "");
	let typesElementsSuccessfullyRemoved = [], failed = [];
	let policeBotData = readPoliceBotData();
	for (let elementIdToRemove of elementsIdToRemove) {
		if (/[iw]#[0-9]+/.test(elementIdToRemove)) { // infraction or warn to remove
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

module.exports = {readInfoData, addInfoData, writeInfoData, getAvailableId, removeElement, groupElementsByMemberId, infoTypeFromIdFirstLetter};
