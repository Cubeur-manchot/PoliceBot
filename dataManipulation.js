"use strict";

const fs = require("fs");
const {google} = require("googleapis");

const spreadsheetId = "1Fn144WOdpBKbktlesaU9NfEFZIbjLpTin77SaOrLj6M";

const loadData = async tabName => {
	let auth = getAuth();
	return (await (await getSpreadsheetsValues(auth)).get({
		auth: auth,
		spreadsheetId: spreadsheetId,
		range: tabName
	})).data.values;
};

const convertDataObjectToTableData = (object, tabName) => {
	return [tabName === "infractions" ? [object.id, object.memberId, object.date, object.type, object.commentary]
		: tabName === "warns" ? [object.id, object.memberId, object.date, object.reason, object.commentary]
			: tabName === "bans" ? [object.id, object.memberId, object.date, object.expirationDate, object.reason, object.commentary]
				: tabName === "members" ? [object.memberId, object.username, object.tag]
					: tabName === "discussions" ? [object.id, object.savingDate, object.action, object.channelId, convertMessageObjectListToString(object.messages)]
						: []];
};

const appendData = async (newObject, tabName) => {
	let tableData = convertDataObjectToTableData(newObject, tabName);
	let auth = getAuth();
	await (await getSpreadsheetsValues(auth)).append({
		auth: auth,
		spreadsheetId: spreadsheetId,
		range: tabName,
		valueInputOption: "RAW",
		resource: {
			values: tableData
		}
	}, undefined);
};

const updateData = async (newObject, tabName) => {
	let tableData = convertDataObjectToTableData(newObject, tabName);
	let elementId = tableData[0][0] + "";
	let auth = getAuth();
	let currentData = await loadData(tabName);
	let rawIndex = currentData.findIndex(raw => raw[0] === elementId);
	if (rawIndex !== -1) {
		await (await getSpreadsheetsValues(auth)).update({
			auth: auth,
			spreadsheetId: spreadsheetId,
			range: `${tabName}!A${rawIndex + 1}:${tabName === "bans" ? "F" : "C"}${rawIndex + 1}`, // +1 because lines number starts at 1 in Google Sheet
			valueInputOption: "RAW",
			resource: {
				values: tableData
			}
		}, undefined);
	}
};

const eraseRawData = async (tabName, rawIndex) => {
	let auth = getAuth();
	await (await getSpreadsheetsValues(auth)).update({
		auth: auth,
		spreadsheetId: spreadsheetId,
		range: `${tabName}!A${rawIndex}:${tabName === "bans" ? "F" : "E"}${rawIndex}`,
		valueInputOption: "RAW",
		resource: {
			values: [tabName === "bans" ? ["", "", "", "", "", ""] : ["", "", "", "", ""]]
		}
	}, undefined);
};

const getAuth = () => new google.auth.GoogleAuth({keyFile: "credentials.json", scopes: "https://www.googleapis.com/auth/spreadsheets"});

const getSpreadsheetsValues = async auth => google.sheets({version: "v4", auth: await auth.getClient()}).spreadsheets.values;

const setupGoogleSheetsAPICredentials = () => {
	fs.writeFile("credentials.json", JSON.stringify({
		type: process.env.CREDENTIALS_type,
		project_id: process.env.CREDENTIALS_project_id,
		private_key_id: process.env.CREDENTIALS_private_key_id,
		private_key: process.env.CREDENTIALS_private_key,
		client_email: process.env.CREDENTIALS_client_email,
		client_id: process.env.CREDENTIALS_client_id,
		auth_uri: process.env.CREDENTIALS_auth_uri,
		token_uri: process.env.CREDENTIALS_token_uri,
		auth_provider_x509_cert_url: process.env.CREDENTIALS_auth_provider_x509_cert_url,
		client_x509_cert_url: process.env.CREDENTIALS_client_x509_cert_url
	}), function (err) {
		if (err) {throw err;} else {console.log("Google spreadsheets credentials file written successfully !")}
	});
};

const readPoliceBotData = () =>
	JSON.parse(fs.readFileSync("./policeBotData.json"));

const readInfoData = async infoType => {
	if (infoType === "discussions") {
		return readPoliceBotData().discussions;
	} else {
		let data = await loadData(infoType);
		let elementList = [];
		let headers = data[0];
		let headersLength = headers.length;
		for (let lineIndex = 1; lineIndex < data.length; lineIndex++) {
			let element = {};
			for (let columnIndex = 0; columnIndex < headersLength; columnIndex++) {
				element[headers[columnIndex]] = data[lineIndex][columnIndex] ? data[lineIndex][columnIndex] : "";
			}
			elementList.push(element);
		}
		if (infoType === "members") {
			let memberList = {};
			for (let element of elementList) {
				memberList[element.memberId] = element;
			}
			return memberList;
		} else {
			return elementList;
		}
	}
};

const writePoliceBotData = policeBotDataObject =>
	fs.writeFileSync("./policeBotData.json", JSON.stringify(policeBotDataObject, null, "\t"));

const getAvailableId = async infoType => {
	let dataOfThisType = await readInfoData(infoType);
	let idWithoutIncrement = infoType[0].toLowerCase() + "#";
	for (let increment = 1; increment < 100; increment++) {
		if (!dataOfThisType.find(dataInstance => dataInstance.id === idWithoutIncrement + increment)) { // id is free
			return idWithoutIncrement + increment;
		}
	}
};

const removeBulkData = async elementsIdList => {
	let elementsIdGroupedByType = groupElementsIdByType(elementsIdList);
	for (let type in elementsIdGroupedByType) {
		if (type === "discussions") {
			let policeBotData = readPoliceBotData();
			for (let elementId of elementsIdGroupedByType.discussions) {
				let index = policeBotData.discussions.findIndex(element => element.id === elementId);
				if (index !== -1) {
					policeBotData.discussions.splice(index, 1);
				}
			}
			writePoliceBotData(policeBotData);
		} else {
			let data = await readInfoData(type);
			for (let elementId of elementsIdGroupedByType[type]) {
				let index = data.findIndex(element => element.id === elementId);
				if (index !== -1) {
					await eraseRawData(type, index + 2); // +1 because line starts at 1 in Google Sheets, and +1 because of the header line
				}
			}
		}
	}
};

const infoTypeFromIdFirstLetter = {
	i: "infractions",
	w: "warns",
	b: "bans",
	d: "discussions"
};

const groupElementsIdByType = elementsId => {
	let result = {infractions: [], warns: [], bans: [], discussions: []};
	for (let elementId of elementsId) {
		result[infoTypeFromIdFirstLetter[elementId[0]]].push(elementId);
	}
	return result;
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

const separator = "¶";

const convertMessageObjectListToString = messageObjectList => {
	let messageStringList = [];
	for (let messageObject of messageObjectList) {
		messageStringList.push(messageObject.authorId + separator + messageObject.date + separator + messageObject.content);
	}
	return messageStringList.join(separator + separator);
};

module.exports = {
	setupGoogleSheetsAPICredentials,
	readInfoData, appendData, updateData,
	removeBulkData,
	getAvailableId, groupElementsByMemberId, groupElementsIdByType, infoTypeFromIdFirstLetter
};
