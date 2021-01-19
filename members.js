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

const banMember = (memberId, memberList) => memberList.ban(memberId)
	.catch(console.error);

const unbanMember = (memberId, memberList) => memberList.unban(memberId)
	.catch(console.error);

module.exports = {getMemberFromId, getMembersFromName, banMember, unbanMember};
