FROM node:16-alpine

ENV NODE_ENV production

COPY package.json .

RUN npm install

# Trunk scripts
COPY index.js eventHandler.js /
# Branch scripts
COPY generalCommands.js infractionsWarnsBans.js badWords.js inviteLinks.js messageBuilder.js discussions.js /
# Leaf scripts
COPY messages.js members.js date.js dataManipulation.js helpMessages.js /

CMD ["node", "index.js"]
