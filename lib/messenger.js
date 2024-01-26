require('dotenv').config()
const config = require('../config')
const handlers = require('../handlers')
const InputParser = require('./inputParser')
const inputParser = new InputParser()
const tmi = require('tmi.js');


class Messenger {
    constructor () {
        const opts = {
            options: { debug: true },
            identity: {
                username: config.twitch.username,
                password: config.twitch.password
            },
            channels: [ config.twitch.channels ]
        };
        console.log(opts);
        this.bot = new tmi.client(opts);
    }

    listen () {
        this.bot.on('message', this.handleText.bind(this));
        this.bot.on('connected', this.handleConnect.bind(this));

        return this.bot.connect()
    }

    handleText (target, context, msg, self) {
        if (self) { return; } // Ignore messages from the bot

        const text = msg.trim();

        if (inputParser.isAskingForRollDice(text))
            return handlers.generic.rollDice(target, this.bot)
    }

    handleConnect (addr, port) {
        console.log(`* Connected to ${addr}:${port}`);
    }
}


module.exports = Messenger
