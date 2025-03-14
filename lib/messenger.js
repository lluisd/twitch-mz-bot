require('dotenv').config()
const config = require('../config')
const handlers = require('../handlers')
const InputParser = require('./inputParser')
const inputParser = new InputParser()
const tmi = require('@twurple/auth-tmi')
const { RefreshingAuthProvider } = require('@twurple/auth')
const TokenService = require("../services/token")
const Notifier = require("./notifier")
const {isMod, isBroadcaster, isVip, isAdmin, isEditor} = require("./helper");
const Logger = require('../services/logger')
const { ApiClient } = require('@twurple/api');

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
            tf: false,
            openai: false,
            unbanRoulette: false,
            timeoutRoulette: false
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
        this.bot.on('message', this.handleText.bind(this))
        this.bot.on('connected', this.handleConnect.bind(this))

        this.bot.connect().catch(console.error)
        return this.bot
    }

    async handleText (target, context, msg, self) {
        if (self) { return; } // Ignore messages from the bot

        if (context['username'].toLowerCase() !== config.twitch.username.toLowerCase())
            await Logger.logChatMessage(context['room-id'], context['username'], msg)


        const text = msg.trim();
        const textSplit = text.split(' ')

        // Generic
        if (textSplit.length > 0 && inputParser.isAskingForRollDice(textSplit[0]))
            return handlers.generic.rollDice(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingForServerStatus(textSplit[0]))
            return handlers.generic.status(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingForOF(textSplit[0]) && this._isNotCooldown('of',15))
            return handlers.generic.randomYoutubeLink(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingToSetTitle(textSplit[0]) && (isMod(context) || isBroadcaster(context) || isEditor(context)))
            return handlers.stream.changeTitle(textSplit.slice(1).join(' '))

        if (textSplit.length > 1 && inputParser.isAskingToSetGame(textSplit[0]) && (isMod(context) || isBroadcaster(context) || isEditor(context)))
            return handlers.stream.changeCategory(textSplit.slice(1).join(' '))

        // Weather
        if (textSplit.length > 1 && inputParser.isAskingForSunset(textSplit[0]))
            return handlers.weather.getSunset(target, textSplit.slice(1).join(' '), this.bot)

        if (textSplit.length > 1 && inputParser.isAskingForSunrise(textSplit[0]))
            return handlers.weather.getSunrise(target, textSplit.slice(1).join(' '), this.bot)


        // Birthday
        if (textSplit.length === 2 && inputParser.isAskingForAddBirthday(textSplit[0]) && textSplit[1].includes('-'))
            return handlers.birthday.addBirthday(target, textSplit.slice(1).join(' '), this.bot, context['display-name'])

        if (textSplit.length === 2 && inputParser.isAskingForGetBirthday(textSplit[0]) && !textSplit[1].includes('-'))
            return handlers.birthday.getBirthday(target, textSplit[1], this.bot)


        // Temps de Flors
        if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFSpot(textSplit[0])
            && this._isNotCooldown('tf', 15))
            return handlers.tempsDeFlors.getSpot(target, textSplit[1], this.bot, context['room-id'])

        if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFSpotsCount(textSplit[0])
            && this._isNotCooldown('tf', 15))
            return handlers.tempsDeFlors.getTotalSpot(target, this.bot, context['room-id'])

        if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFVisited(textSplit[0]) &&
            (isVip(context) || isMod(context) || isBroadcaster(context)))
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], true)

        if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFNotVisited(textSplit[0]) &&
            (isMod(context) || isBroadcaster(context)))
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], false)

        if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFDeactivateSpot(textSplit[0]) &&
            (isVip(context) || isMod(context) || isBroadcaster(context)))
            return handlers.tempsDeFlors.setDeactivate(target, this.bot)

        if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFActiveSpot(textSplit[0]) &&
            (isVip(context) || isMod(context) || isBroadcaster(context)))
            return handlers.tempsDeFlors.setActive(target, textSplit[1], this.bot, context['room-id'])

        if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForShowScreenshots(textSplit[0]))
            return handlers.stream.getScreenshots(target, this.bot)

        if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFScreenshot(textSplit[0]) &&
            this._isNotCooldown('screenshotTF', 30, 'screenshot') &&
            await handlers.tempsDeFlors.hasActiveSpot())
            return handlers.tempsDeFlors.captureScreenshot(target, textSplit[1], this.bot, context['display-name'], context['room-id'])


        // Stream
        if (textSplit.length > 0 && inputParser.isAskingForTakeScreenshot(textSplit[0]) && this._isNotCooldown('screenshot', 30))
            return handlers.stream.captureScreenshot(target, this.bot, this.notifier.bot, context['display-name'], context['room-id'])

        if (textSplit.length > 0 && inputParser.isAskingForF5(textSplit[0]) &&
            (isVip(context) ||isMod(context) || isBroadcaster(context)))
            return handlers.stream.refreshPage(target, this.bot, this.notifier.bot)

        if (textSplit.length > 1 && inputParser.isAskingToSetOnChannelFollowNotificationMessage(textSplit[0]) &&
            (isVip(context) ||isMod(context) || isBroadcaster(context)))
            return handlers.stream.setNotifyChannelFollowMessage(textSplit[1])

        // Bans
        if (textSplit.length > 0 && inputParser.isAskingBans(textSplit[0]) &&
            this._isNotCooldown('bans', 15))
            return handlers.ban.getBansCountAndUnbanRequests(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingLastTimeouts(textSplit[0]) && (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.getTimeouts(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingUnbanRoulette(textSplit[0]) && (isVip(context) || isAdmin(context) || isMod(context) || isBroadcaster(context)) && this._isNotCooldown('unbanRoulette',86400))
            return handlers.ban.unbanRoulette(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingTimeoutRoulette(textSplit[0]) && (isAdmin(context) || isMod(context) || isBroadcaster(context)) && this._isNotCooldown('timeoutRoulette',600))
            return handlers.ban.timeoutRoulette(target, this.bot, textSplit.slice(1))

        if (textSplit.length > 0 && inputParser.isAskingToUnbanAll(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.unbanAll(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingToTimeoutUser(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.ban(target, textSplit[1], this.bot, textSplit[2] || 600)

        if (textSplit.length > 1 && inputParser.isAskingToBanUser(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.ban(target, textSplit[1], this.bot)

        if (textSplit.length > 1 && inputParser.isAskingTOUnbanUser(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.unban(target, textSplit[1], this.bot)

        if (textSplit.length > 0 && inputParser.isAskingUpdateBansList(textSplit[0]) && isAdmin(context))
            return handlers.ban.updateBansList(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingSetStrike(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
            return handlers.ban.setStrike(target, textSplit[1].replace(/^@/, ''), this.bot)

        // Events
        if (textSplit.length > 0 && inputParser.isAskingForTarracoMangaEvent(textSplit[0]))
            return handlers.events.sendTarracoMangaEvent()

        // OPEN AI
        if (textSplit.length > 1 && inputParser.isAskingOpenAI(textSplit[0]) && this._isNotCooldown('openai',15)) {
            return handlers.openAI.askOpenAI(target,  textSplit.slice(1).join(' '), context['display-name'], this.bot)
        }

        if (textSplit.length > 1 && inputParser.isAskingBotOpenAI(text) && this._isNotCooldown('openai',15)) {
            const regex = new RegExp(`@?${config.twitch.username}`, 'gi')
            const textWithoutMention = text.replace(regex, '').trim()
            return handlers.openAI.askOpenAI(target, textWithoutMention, context['display-name'], this.bot)
        }

        if (textSplit.length > 0 && inputParser.isAskingToUploadChatToOpenAI(textSplit[0]) && isAdmin(context))
            return await handlers.openAI.createAndUploadToChat(target, this.bot, true)

        if (textSplit.length > 0 && inputParser.isAskingToUploadStreamToOpenAI(textSplit[0]) && isAdmin(context))
            return await handlers.openAI.uploadStreamToOpenai(target, this.bot, true)
    }

    handleConnect (addr, port) {
        console.log(`* Connected to ${addr}:${port}`)
    }

    _isNotCooldown (property, seconds = 3, extraProperty) {
        if (!this.cooldown[property]) {
            this.cooldown[property] = true
            if (this.cooldown[extraProperty]) this.cooldown[extraProperty] = true
            setTimeout(() => {
                this.cooldown[property] = false
                if (this.cooldown[extraProperty]) this.cooldown[extraProperty] = false
            }, seconds * 1000)
            return true;
        }
        return false;
    }
}

module.exports = Messenger
