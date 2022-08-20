"use strict";

const {sendMessageToChannel, deleteMessage} = require("./messages.js");

const immatureWordsList = ["feur", "ratio", "lekip"];

const handleImmatureWords = async message => {
    for (let immatureWord of immatureWordsList) {
        if (message.content.toLowerCase().startsWith(immatureWord)
            || (message.content.toLowerCase().includes(immatureWord) && message.content.length < 20)) {
            deleteMessage(message);
            return;
        }
    }
};

module.exports = {handleImmatureWords};
