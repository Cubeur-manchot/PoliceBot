FROM node:14

ENV NODE_ENV production

COPY package.json .

RUN npm install

COPY index.js eventHandler.js messageHandler.js badWords.js infractions.js /

CMD ["node", "index.js"]
