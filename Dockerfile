FROM node:14

ENV NODE_ENV production

COPY package.json .

RUN npm install

COPY index.js eventHandler.js messageHandler.js messageBuilder.js helpMessages.js badWords.js dataManipulation.js infractionsWarnsBans.js date.js members.js /

CMD ["node", "index.js"]
