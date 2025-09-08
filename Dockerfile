FROM node:24-alpine

RUN apk upgrade --no-cache

RUN apk add --no-cache \
    bash

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY . .

RUN npm install

USER node

EXPOSE 3000

CMD npm start
