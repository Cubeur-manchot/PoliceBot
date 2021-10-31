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
		return readPoliceBotData()[infoType];
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

const removePoliceBotData = elementsIdList => {
	if (elementsIdList.length) {
		let policeBotData = readPoliceBotData();
		for (let elementId of elementsIdList) {
			let elementType = infoTypeFromIdFirstLetter[elementId[0]];
			let index = policeBotData[elementType].findIndex(element => element.id === elementId);
			if (index !== -1) {
				policeBotData[elementType].splice(index, 1);
			}
		}
		writePoliceBotData(policeBotData);
	}
};

const infoTypeFromIdFirstLetter = {
	i: "infractions",
	w: "warns",
	b: "bans",
	d: "discussions"
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

module.exports = {
	setupGoogleSheetsAPICredentials,
	readInfoData, addInfoData, writeInfoData,
	readPoliceBotData, removePoliceBotData,
	getAvailableId, groupElementsByMemberId, infoTypeFromIdFirstLetter
};
