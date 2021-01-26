FROM node:14

ENV NODE_ENV production

COPY package.json .

RUN npm install

# Trunk scripts
COPY index.js eventHandler.js /
# Branch scripts
COPY infractionsWarnsBans.js badWords.js messageBuilder.js discussions.js /
# Leaf scripts
COPY messages.js members.js date.js dataManipulation.js helpMessages.js /

CMD ["node", "index.js"]
