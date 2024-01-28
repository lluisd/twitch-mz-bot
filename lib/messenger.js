require('dotenv').config()
const config = require('../config')
const handlers = require('../handlers')
const InputParser = require('./inputParser')
const inputParser = new InputParser()
const tmi = require('@twurple/auth-tmi')
const { RefreshingAuthProvider } = require('@twurple/auth')
const TokenService = require("../services/token");


class Messenger {
    constructor () {}

    async init() {
        await this.tokenAutoRefresh()

        const opts = {
            options: { debug: true },
            authProvider: this.authProvider,
            channels: [ config.twitch.channels ]
        }
        this.bot = new tmi.client(opts)

        this.listen()
    }

    async tokenAutoRefresh () {
        this.authProvider =  new RefreshingAuthProvider(
            {
                clientId: config.twitch.clientId,
                clientSecret: config.twitch.clientSecret
            }
        )
        const tokenData = await TokenService.getToken(config.twitch.userId)

        this.authProvider.onRefresh(async ( userId, newTokenData) => {
            await TokenService.updateToken(userId, newTokenData)
        })

        this.authProvider.addUser(parseInt(config.twitch.userId), tokenData,  ['chat'])
    }

    listen () {
        this.bot.on('message', this.handleText.bind(this));
        this.bot.on('connected', this.handleConnect.bind(this));

        return this.bot.connect().catch(console.error)
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
