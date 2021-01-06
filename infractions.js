"use strict";

const fs = require("fs");

const readInfractions = () => {
	let infractionsJsonFile = fs.readFileSync("./infractions.json");
	return JSON.parse(infractionsJsonFile);
};

const writeInfractions = infractionsObject => {
	fs.writeFileSync("./infractions.json", JSON.stringify(infractionsObject, null, "\t"));
};

module.exports = {readInfractions, writeInfractions};
