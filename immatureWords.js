"use strict";

const {sendMessageToChannel} = require("./messages.js");

const handleImmatureWords = async message => {
    if (message.content.toLowerCase().startsWith("feur")
        || message.content.toLowerCase().includes("(feur)")) {
        sendMessageToChannel(message.channel, "Sérieux tu n'as rien de plus mature ? :unamused:");
    }
};

module.exports = {handleImmatureWords};
