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
        this.cooldown = {
            screenshot: false,
            of: false,
            bans: false,
            screenshotTF: false,
            tf: false
        }
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

    async handleText (target, context, msg, self) {
        if (self) { return; } // Ignore messages from the bot

        const text = msg.trim();
        const textSplit = text.split(' ')

        if (textSplit.length > 0 && inputParser.isAskingForRollDice(textSplit[0]))
            return handlers.generic.rollDice(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingForOF(textSplit[0])){
            if (!this.cooldown.of) {
                this.cooldown.of = true
                setTimeout(() => {
                    this.cooldown.of = false
                }, 15000)
                return handlers.generic.randomYoutubeLink(target, this.bot)
            }
        }

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

        if (textSplit.length > 0 && inputParser.isAskingForF5(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context)))
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

        if (textSplit.length > 0 && inputParser.isAskingForPendingUnbanRequests(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context))) {
            if (!this.cooldown.bans) {
                this.cooldown.bans = true
                setTimeout(() => {
                    this.cooldown.bans = false
                }, 30000)
                return handlers.stream.getUnbanRequests(target, this.bot)
            }
        }

        if (textSplit.length > 1 && inputParser.isAskingForTFSpot(textSplit[0])) {
            if (!this.cooldown.tf) {
                this.cooldown.tf = true
                setTimeout(() => {
                    this.cooldown.tf = false
                }, 15000)
                return handlers.tempsDeFlors.getSpot(target, textSplit[1], this.bot, context['room-id'])
            }

        }

        if (textSplit.length > 0 && inputParser.isAskingForTFSpotsCount(textSplit[0])) {
            if (!this.cooldown.tf) {
                this.cooldown.tf = true
                setTimeout(() => {
                    this.cooldown.tf = false
                }, 15000)
                return handlers.tempsDeFlors.getTotalSpot(target, this.bot, context['room-id'])
            }
        }

        if (textSplit.length > 1 && inputParser.isAskingForTFVisited(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context))) {
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], true)
        }

        if (textSplit.length > 1 && inputParser.isAskingForTFNotVisited(textSplit[0]) &&
            (this._isMod(context) || this._isBroadcaster(context))) {
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], false)
        }

        if (textSplit.length > 0 && inputParser.isAskingForTFDeactivateSpot(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context))) {
            return handlers.tempsDeFlors.setActive(target, 0, this.bot, context['room-id'])
        }

        if (textSplit.length > 1 && inputParser.isAskingForTFActiveSpot(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context))) {
            return handlers.tempsDeFlors.setActive(target, textSplit[1], this.bot, context['room-id'])
        }

        if (textSplit.length > 0 && inputParser.isAskingForTFScreenshot(textSplit[0]) && await handlers.tempsDeFlors.hasActiveSpot()) {
            if (!this.cooldown.screenshotTF) {
                this.cooldown.screenshotTF = true
                setTimeout(() => {
                    this.cooldown.screenshotTF = false
                }, 10000)
                return handlers.tempsDeFlors.captureScreenshot(target, textSplit[1], this.bot, context['display-name'], context['room-id'])
            }
        }

        if (textSplit.length > 0 && inputParser.isAskingForTakeScreenshot(textSplit[0])){
            if (!this.cooldown.screenshot) {
                this.cooldown.screenshot = true
                setTimeout(() => {
                    this.cooldown.screenshot = false
                }, 30000)
                return handlers.stream.captureScreenshot(target, this.bot, this.notifier.bot, context['display-name'], context['room-id'])
            }
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

    _isVip(context) {
        return context['vip'] || context.badges.vip
    }

    _isMod(context) {
        return context['mod']
    }

    _isBroadcaster(context) {
        return context['user-id'] === context['room-id']
    }
}

module.exports = Messenger
