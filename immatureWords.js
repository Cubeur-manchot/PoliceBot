"use strict";

const {sendMessageToChannel} = require("./messages.js");

const handleImmatureWords = message => {
    if (message.content.toLowerCase().startsWith("feur")) {
        sendMessageToChannel(message.channel, "Sérieux tu n'as rien de plus mature ? :unamused:");
    }
};

module.exports = {handleImmatureWords};
