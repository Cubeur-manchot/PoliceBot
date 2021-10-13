"use strict";

const getMemberFromId = (memberIdToSearch, memberList) => {
	for (let memberId of Object.keys(memberList)) {
		if (memberId === memberIdToSearch) { // found matching id
			return memberId;
		}
	}
	return undefined; // member has not been found
};

const getMembersFromName = (memberNameToSearch, memberList) => {
	let matchingMembersId = [];
	for (let memberId of Object.keys(memberList)) {
		if (memberList[memberId].username === memberNameToSearch || memberList[memberId].tag === memberNameToSearch) {
			matchingMembersId.push(memberId);
		}
	}
	return matchingMembersId;
};

const banMember = async (memberId, memberList) => {
	let status = "Success";
	await memberList.ban(memberId)
		.catch(error => {
			status = "Error";
			console.error(error);
		});
	return status;
};

const unbanMember = (memberId, memberList, withoutConsole) => {
	memberList.unban(memberId)
		.catch(withoutConsole ? () => {} : console.error)
};

module.exports = {getMemberFromId, getMembersFromName, banMember, unbanMember};
