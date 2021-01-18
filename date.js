"use strict";

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

const getReadableDiffDate = (firstDate, secondDate) => {
	let diffResultFirstLevel = getReadableDiffDateOneLevel(firstDate, secondDate);
	if (diffResultFirstLevel.unit === "seconds") { // if only seconds, display only one level
		return `${diffResultFirstLevel.diffTime} second${diffResultFirstLevel.diffTime === 1 ? "" : "s"}`;
	} else { // else, display two levels
		let diffResultSecondLevel = getReadableDiffDateOneLevel(firstDate, diffResultFirstLevel.approximatedDate);
		return `${diffResultFirstLevel.diffTime} ${diffResultFirstLevel.unit} and ${diffResultSecondLevel.diffTime} ${diffResultSecondLevel.unit}`;
	}
};

const getReadableDiffDateOneLevel = (firstDate, secondDate) => {
	let diffTimeInSeconds = Math.floor((firstDate - secondDate)/1000);
	if (diffTimeInSeconds < 60) {
		return {
			diffTime: diffTimeInSeconds,
			unit: `second${diffTimeInSeconds === 1 ? "" : "s"}`,
			approximatedDate: new Date(secondDate.getTime() + diffTimeInSeconds*1000) // add seconds
		};
	} else if (diffTimeInSeconds < 3600) {
		let diffTimeInMinutes = Math.floor(diffTimeInSeconds/60);
		return {
			diffTime: diffTimeInMinutes,
			unit: `minute${diffTimeInMinutes === 1 ? "" : "s"}`,
			approximatedDate: new Date(secondDate.getTime() + diffTimeInMinutes*60000) // add minutes
		};
	} else if (diffTimeInSeconds < 86400) {
		let diffTimeInHours = Math.floor(diffTimeInSeconds/3600);
		return {
			diffTime: diffTimeInHours,
			unit: `hour${diffTimeInHours === 1 ? "" : "s"}`,
			approximatedDate: new Date(secondDate.getTime() + diffTimeInHours*3600000) // add hours
		};
	} else {
		let secondDatePlusOneMonth = new Date(secondDate);
		secondDatePlusOneMonth.setMonth(secondDatePlusOneMonth.getMonth() + 1);
		if (firstDate < secondDatePlusOneMonth) {
			let diffTimeInDays = Math.floor(diffTimeInSeconds/86400);
			return {
				diffTime: diffTimeInDays,
				unit: `day${diffTimeInDays === 1 ? "" : "s"}`,
				approximatedDate: new Date(secondDate.getTime() + diffTimeInDays*86400000) // add days
			};
		} else {
			let secondDatePlusOneYear = new Date(secondDate);
			secondDatePlusOneYear.setFullYear(secondDatePlusOneYear.getFullYear() + 1);
			if (firstDate < secondDatePlusOneYear) {
				let secondDatePlusSomeMonths = secondDatePlusOneMonth;
				let monthCount = 0;
				while (secondDatePlusSomeMonths < firstDate) { // look for the number of months
					monthCount++;
					secondDatePlusSomeMonths.setMonth(secondDatePlusSomeMonths.getMonth() + 1);
				}
				secondDatePlusSomeMonths.setMonth(secondDatePlusSomeMonths.getMonth() - 1);
				return {
					diffTime: monthCount,
					unit: `month${monthCount === 1 ? "" : "s"}`,
					approximatedDate: secondDatePlusSomeMonths // add months
				};
			} else {
				let secondDatePlusSomeYears = new Date(secondDatePlusOneYear);
				let yearCount = 0;
				while (secondDatePlusSomeYears < firstDate) { // look for the number of years
					yearCount++;
					secondDatePlusSomeYears.setFullYear(secondDatePlusSomeYears.getFullYear() + 1);
				}
				secondDatePlusSomeYears.setFullYear(secondDatePlusSomeYears.getFullYear() - 1);
				return {
					diffTime: yearCount,
					unit: `year${yearCount === 1 ? "" : "s"}`,
					approximatedDate: secondDatePlusSomeYears
				};
			}
		}
	}
};

module.exports = {getReadableDate, getReadableDiffDate, parseDate};
