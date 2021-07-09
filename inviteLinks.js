"use strict";

const https = require('https');
const {sendMessageToChannel, sendPrivateMessage, sendLog, deleteMessage} = require("./messages.js");
const {buildInviteLinkLogEmbed, buildInviteLinkPrivateMessage} = require("./messageBuilder.js");
const {addInfoData, getAvailableId} = require("./dataManipulation.js");
const {getReadableDate} = require("./date.js");

const serversWhiteList = {
    "469467545041240064": "5-Style",
    "464107131105312788": "AFSpeedcubing",
    "478979441041866764": "Alg Resource",
    "825396372412039228": "Annecy Cubing",
    "755919703817322618": "Brian Sun's Official Server",
    "693508715676041296": "CubeRoot",
    "95625180205813760" : "Cubers",
    "329175643877015553": "Cubeurs Francophones",
    "561202518185607168": "Cube Bot",
    "690084292323311720": "Cubing at Home",
    "582676753512923136": "Cubing Nation",
    "535587640926535710": "LaZer's Community Server",
    "769483322278805504": "Mehta",
    "422718228913979392": "Notifications du Manchot",
    "416929203607568404": "Roux Method Speed Solvers",
    "569832276091731983": "SpeedSolving Chat"
};

const getInvitationsNotInWhiteList = async message => {
    let invitationIds = message.content.match(/(?<=https:\/\/discord\.gg\/)[0-9a-z]+/gi);
    let invitationsNotInWhiteList = [];
    if (invitationIds !== null) {
        for (let invitationId of invitationIds) {
            let serverInfo = await getServerInfoFromInvitationId(invitationId);
            if (!serversWhiteList[serverInfo.id]) {
                invitationsNotInWhiteList.push(`https://discord.gg/${invitationId} (${serverInfo.name})`);
            }
        }
    }
    return invitationsNotInWhiteList;
};

const handleInviteLinks = async message => {
    let invitationsNotInWhiteList = await getInvitationsNotInWhiteList(message);
    if (invitationsNotInWhiteList.length) {
        deleteMessage(message);
        let infractionId = getAvailableId("infractions");
        addInfoData({
            id: infractionId,
            memberId: message.author.id,
            date: getReadableDate(message.createdAt),
            type: "Invitation link",
            commentary: invitationsNotInWhiteList.join(", ")
        },"infractions");
        let warningMessage = await sendMessageToChannel(message.channel, "Les invitations vers d'autres serveurs sont interdites ! :no_entry: ");
        sendLog(buildInviteLinkLogEmbed(message, invitationsNotInWhiteList, warningMessage, infractionId), warningMessage.client);
        sendPrivateMessage(message.author, buildInviteLinkPrivateMessage(invitationsNotInWhiteList) + "\n\nMessage original :\n" + message.content);
    }
};

const handleInviteLinksSoft = async message => {
    let invitationsNotInWhiteList = await getInvitationsNotInWhiteList(message);
    if (invitationsNotInWhiteList.length) {
        sendMessageToChannel(message.channel, buildInviteLinkPrivateMessage(invitationsNotInWhiteList) + "\n\nMessage original :\n" + message.content)
    }
};

const getServerInfoFromInvitationId = async invitationId => {
    let httpRequest = new Promise((resolve, reject) => {
        let url = `https://discordapp.com/api/invites/${invitationId}`;
        https.get(url, response => {
            let data = "";
            response.on("data", dataChunk => {
                data += dataChunk;
            });
            response.on('end', () => {
                resolve(data.toString());
            });
            response.on("error", error => {
                reject(error);
            });
        });
    });
    try {
        let httpResult = await httpRequest;
        let server = JSON.parse(httpResult.toString()).guild;
        return server ? {
            id: server.id,
            name: server.name
        } : null;
    } catch (error) {
        console.error(error);
        return null;
    }
};

module.exports = {handleInviteLinks, handleInviteLinksSoft};
