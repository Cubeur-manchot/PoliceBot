FROM node:14

ENV NODE_ENV production

COPY package.json .

RUN npm install

COPY index.js eventHandler.js messageHandler.js badWords.js dataManipulation.js infractions.js warns.js /

CMD ["node", "index.js"]
