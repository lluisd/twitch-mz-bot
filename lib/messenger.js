require('dotenv').config()
const config = require('../config')
const handlers = require('../handlers')
const InputParser = require('./inputParser')
const inputParser = new InputParser()
const tmi = require('@twurple/auth-tmi')
const { RefreshingAuthProvider } = require('@twurple/auth')
const TokenService = require("../services/token")
const Notifier = require("./notifier")

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

        this.notifier = new Notifier(this.bot)
        await this.notifier.notify()

        return this.listen()
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
        this.bot.on('unhost', this.handleUnhost.bind(this));
        this.bot.on('hosting', this.handleHosting.bind(this));

        return this.bot.connect().catch(console.error)


    }

    handleText (target, context, msg, self) {
        if (self) { return; } // Ignore messages from the bot

        const text = msg.trim();
        const textSplit = text.split(' ')

        if (textSplit.length > 0 && inputParser.isAskingForRollDice(textSplit[0]))
            return handlers.generic.rollDice(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingForSunset(textSplit[0])) {
            return handlers.weather.getSunset(target, textSplit.slice(1).join(' '), this.bot)
        }

        if (textSplit.length > 1 && inputParser.isAskingForSunrise(textSplit[0])) {
            return handlers.weather.getSunrise(target, textSplit.slice(1).join(' '), this.bot)
        }

        if (textSplit.length > 2 && inputParser.isAskingForNextMDTrain(textSplit[0])) {
            return handlers.train.getNextMD(target, textSplit.slice(1).join(' '), this.bot)
        }

        if (textSplit.length > 2 && inputParser.isAskingForNextAveTrain(textSplit[0])) {
            return handlers.train.getNextAVE(target, textSplit.slice(1).join(' '), this.bot)
        }

        if (textSplit.length > 0 && inputParser.isAskingForTakeScreenshot(textSplit[0]))
            return handlers.stream.captureScreenshot(target, this.bot, this.notifier.bot, context['display-name'], context['room-id'])

        if (textSplit.length > 0 && inputParser.isAskingForF5(textSplit[0])  && (context['mod'] || context['vip']))
            return handlers.stream.refreshPage(target, this.bot, this.notifier.bot)

        if (textSplit.length === 2 && inputParser.isAskingForAddBirthday(textSplit[0]) && textSplit[1].includes('-')) {
            return handlers.birthday.addBirthday(target, textSplit.slice(1).join(' '), this.bot, context['display-name'])
        }

        if (textSplit.length === 2 && inputParser.isAskingForGetBirthday(textSplit[0]) && !textSplit[1].includes('-')) {
            return handlers.birthday.getBirthday(target, textSplit[1], this.bot)
        }

        if (textSplit.length > 0 && inputParser.isAskingForServerStatus(textSplit[0])) {
            return handlers.generic.status(target, this.bot)
        }
    }

    handleHosting (channel, target, viewers) {
        console.log(`* Hosting ${channel} to ${target} with ${viewers} viewers`);
    }

    handleUnhost (channel, viewers) {
        console.log(`* Unhosting ${channel} with ${viewers} viewers`);
    }

    handleConnect (addr, port) {
        console.log(`* Connected to ${addr}:${port}`)
    }
}

module.exports = Messenger
