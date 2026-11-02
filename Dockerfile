FROM node:24-alpine

RUN apk upgrade --no-cache

RUN apk add --no-cache \
    bash \
    ffmpeg

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN rm -f package-lock.json

RUN npm install

COPY . .

RUN mkdir -p public/audio && chown node:node public/audio

USER node

EXPOSE 3000

CMD npm start
