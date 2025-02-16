FROM node:18-alpine

ENV NODE_ENV production

COPY package.json package-lock.json /
RUN npm ci --omit=dev
RUN rm -f package.json package-lock.json

WORKDIR /app
COPY . .

CMD ["node", "index.js"]
