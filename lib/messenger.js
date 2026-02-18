require('dotenv').config()
const config = require('../config')
const handlers = require('../handlers')
const InputParser = require('./inputParser')
const inputParser = new InputParser()
const Notifier = require("./notifier")
const {isMod, isBroadcaster, isVip, isAdmin, isEditor} = require("./helper");
const Logger = require('../services/logger')
const TelegramBot = require('node-telegram-bot-api')
const logger = require('../lib/logger')
const twitchBot = require('../botClient')

class Messenger {
    constructor () {}

    async init() {
        this.telegramBot = new TelegramBot(config.telegram.apiKey)
        this.cooldown = {
            screenshot: false,
            of: false,
            bans: false,
            vips: false,
            mods: false,
            immunes: false,
            screenshotTF: false,
            tf: false,
            openai: false,
            unbanRoulette: false,
            timeoutRoulette: false,
            blocks: false
        }

        this.twitchBot = await twitchBot.getChatClient()
        this.notifier = new Notifier(this.twitchBot, this.telegramBot)
        await this.notifier.notify()

        return this.listen()
    }

    listen () {
        if (this.twitchBot) {
            this.twitchBot.connect();
            this.twitchBot.onMessage( this.handleText.bind(this))
            this.twitchBot.onConnect(this.handleConnect.bind(this))
        }

        return {
            twitchBot: this.twitchBot,
            telegramBot: this.telegramBot
        }
    }

    async handleText (target, user, msg, context) {
        logger.info(`Twitch - Message from ${user} in #${target}: ${msg}`)

        if (target === user) { return; } // Ignore messages from the bot
        try {
            if (user.toLowerCase() !== config.twitch.username.toLowerCase())
                await Logger.logChatMessage(context.channelId, user, msg, 'twitch')

            const text = msg.trim();
            const textSplit = text.split(' ')

            // Generic
            if (textSplit.length > 0 && inputParser.isAskingForRollDice(textSplit[0]))
                return await handlers.generic.rollDice(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingForServerStatus(textSplit[0]))
                return await handlers.generic.status(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingForOF(textSplit[0]) && this._isNotCooldown('of',15))
                return await handlers.generic.randomYoutubeLink(target, this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToSetTitle(textSplit[0]) && (isMod(context) || isBroadcaster(context) || isEditor(context)))
                return await handlers.stream.changeTitle(textSplit.slice(1).join(' '))

            if (textSplit.length > 1 && inputParser.isAskingToSetGame(textSplit[0]) && (isMod(context) || isBroadcaster(context) || isEditor(context)))
                return await handlers.stream.changeCategory(textSplit.slice(1).join(' '))

            if (textSplit.length > 1 && inputParser.isAskingToAddVip(textSplit[0]) &&  (isAdmin(context) || isBroadcaster(context)))
                return await handlers.stream.addVip(textSplit[1].replace(/^@/, ''))

            if (textSplit.length > 1 && inputParser.isAskingToRemoveVip(textSplit[0]) &&  (isAdmin(context) || isBroadcaster(context)))
                return await handlers.stream.removeVip(textSplit[1].replace(/^@/, ''))

            if (textSplit.length > 1 && inputParser.isAskingToAddMod(textSplit[0]) &&  isAdmin(context))
                return await handlers.stream.addMod(textSplit[1].replace(/^@/, ''))

            if (textSplit.length > 1 && inputParser.isAskingToRemoveMod(textSplit[0]) &&  isAdmin(context))
                return await handlers.stream.removeMod(textSplit[1].replace(/^@/, ''))

            // Weather
            if (textSplit.length > 1 && inputParser.isAskingForSunset(textSplit[0]))
                return await handlers.weather.getSunset(target, textSplit.slice(1).join(' '), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingForSunrise(textSplit[0]))
                return await handlers.weather.getSunrise(target, textSplit.slice(1).join(' '), this.twitchBot)


            // Birthday
            if (textSplit.length === 2 && inputParser.isAskingForAddBirthday(textSplit[0]) && textSplit[1].includes('-'))
                return await handlers.birthday.addBirthday(target, textSplit.slice(1).join(' '), this.twitchBot, context.userInfo.displayName)

            if (textSplit.length === 2 && inputParser.isAskingForGetBirthday(textSplit[0]) && !textSplit[1].includes('-'))
                return await handlers.birthday.getBirthday(target, textSplit[1], this.twitchBot)


            // Temps de Flors
            if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFSpot(textSplit[0])
                && this._isNotCooldown('tf', 15))
                return await handlers.tempsDeFlors.getSpot(target, textSplit[1], this.twitchBot, context.channelId)

            if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFSpotsCount(textSplit[0])
                && this._isNotCooldown('tf', 15))
                return await handlers.tempsDeFlors.getTotalSpot(target, this.twitchBot, context.channelId)

            if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFVisited(textSplit[0]) &&
                (isVip(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.tempsDeFlors.setVisited(target, textSplit[1], this.twitchBot, context.channelId)

            if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFDelete(textSplit[0]) &&
                (isMod(context) || isBroadcaster(context) || isAdmin(context)))
                return await handlers.tempsDeFlors.delete(target, textSplit[1], this.twitchBot, context.channelId)

            if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFDeactivateSpot(textSplit[0]) &&
                (isVip(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.tempsDeFlors.setDeactivate(target, this.twitchBot)

            if (config.features.TFSpots && textSplit.length > 1 && inputParser.isAskingForTFActiveSpot(textSplit[0]) &&
                (isVip(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.tempsDeFlors.setActive(target, textSplit[1], this.twitchBot, context.channelId)

            if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForShowScreenshots(textSplit[0]))
                return await handlers.stream.getScreenshots(target, this.twitchBot)

            if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFCommands(textSplit[0]))
                return await handlers.tempsDeFlors.getCommands(target, this.twitchBot)

            if (config.features.TFSpots && textSplit.length > 0 && inputParser.isAskingForTFScreenshot(textSplit[0]) &&
                this._isNotCooldown('screenshotTF', 15, 'screenshot') &&
                await handlers.tempsDeFlors.hasActiveSpot())
                return await handlers.tempsDeFlors.captureScreenshot(target, textSplit[1], this.twitchBot, context.userInfo.displayName, context.channelId)

            // Stream
            if (textSplit.length > 0 && inputParser.isAskingForTakeScreenshot(textSplit[0]) && this._isNotCooldown('screenshot', 15))
                return await handlers.stream.captureScreenshot(target, this.twitchBot, context.userInfo.displayName, context.channelId)

            if (textSplit.length > 0 && inputParser.isAskingForF5(textSplit[0]) &&
                (isVip(context) ||isMod(context) || isBroadcaster(context)))
                return await handlers.stream.refreshPage()

            if (textSplit.length > 1 && inputParser.isAskingToSetOnChannelFollowNotificationMessage(textSplit[0]) &&
                (isVip(context) ||isMod(context) || isBroadcaster(context)))
                return await handlers.stream.setNotifyChannelFollowMessage(textSplit[1])

            if (textSplit.length > 0 && inputParser.isAskingVips(textSplit[0]) &&
                this._isNotCooldown('vips', 15))
                return await handlers.stream.getVips(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingMods(textSplit[0]) &&
                this._isNotCooldown('mods', 15))
                return await handlers.stream.getMods(target, this.twitchBot)

            // Bans
            if (textSplit.length > 1 && inputParser.isAskingToSetImmunity(textSplit[0]) &&
                (isVip(context) ||isMod(context) || isBroadcaster(context)))
                return await handlers.stream.setImmunity(textSplit[1])

            if (textSplit.length > 0 && inputParser.isAskingImmunes(textSplit[0]) &&
                this._isNotCooldown('immunes', 15))
                return await handlers.stream.getImmunes(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingBans(textSplit[0]) &&
                this._isNotCooldown('bans', 15))
                return await handlers.ban.getBansCountAndUnbanRequests(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingBlocks(textSplit[0]) &&
                this._isNotCooldown('blocks', 15))
                return await handlers.ban.getBlocks(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingLastTimeouts(textSplit[0]) && (isAdmin(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.ban.getTimeouts(target, this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingUnbanRoulette(textSplit[0]) && (isAdmin(context) || isMod(context) || isBroadcaster(context)) && this._isNotCooldown('unbanRoulette',15))
                return await handlers.ban.unbanRoulette(target, this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingTimeoutRoulette(textSplit[0]) && (isVip(context) || isAdmin(context) || isMod(context) || isBroadcaster(context)) && this._isNotCooldown('timeoutRoulette',600))
                return await handlers.ban.timeoutRoulette(target, this.twitchBot, textSplit.slice(1))

            if (textSplit.length > 0 && inputParser.isAskingToUnbanAll(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.ban.unbanAll(target, this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToTimeoutUser(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.ban.ban(target, textSplit[1].replace(/^@/, ''), this.twitchBot, textSplit[2] || 600)

            if (textSplit.length > 1 && inputParser.isAskingToBanUser(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.ban(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToUnbanUser(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.unban(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToBlockUser(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.block(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToUnblockUser(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.unBlock(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToAddToWhitelist(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.addUserToChannelWhitelist(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingToRemoveFromWhitelist(textSplit[0]) &&  isAdmin(context))
                return await handlers.ban.removeUserFromChannelWhitelist(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            if (textSplit.length > 0 && inputParser.isAskingUpdateBansList(textSplit[0]) && isAdmin(context)) {
                await handlers.ban.updateBansList(target, this.twitchBot)
                return await handlers.ban.updateBlocksList(target, this.twitchBot)
            }

            if (textSplit.length > 0 && inputParser.isAskingUpdateVipsList(textSplit[0]) && isAdmin(context)) {
                return await handlers.ban.updateVipsList(target, this.twitchBot)
            }

            if (textSplit.length > 0 && inputParser.isAskingUpdateModsList(textSplit[0]) && isAdmin(context)) {
                return await handlers.ban.updateModsList(target, this.twitchBot)
            }

            if (textSplit.length > 0 && inputParser.isAskingUpdateBlocksList(textSplit[0]) && isAdmin(context))
                return await handlers.ban.updateBlocksList(target, this.twitchBot)

            if (textSplit.length > 1 && inputParser.isAskingSetStrike(textSplit[0]) &&  (isAdmin(context) || isMod(context) || isBroadcaster(context)))
                return await handlers.ban.setStrike(target, textSplit[1].replace(/^@/, ''), this.twitchBot)

            // Events
            if (textSplit.length > 0 && inputParser.isAskingForTarracoMangaEvent(textSplit[0]))
                return await handlers.events.sendTarracoMangaEvent()

            // OPEN AI
            if (textSplit.length > 1 && inputParser.isAskingOpenAI(textSplit[0]) && this._isNotCooldown('openai',15)) {
                return await handlers.openAI.askOpenAI(target,  textSplit.slice(1).join(' '), context.userInfo.displayName, this.twitchBot)
            }

            if (textSplit.length > 1 && inputParser.isAskingBotOpenAI(text) && this._isNotCooldown('openai',15)) {
                const regex = new RegExp(`@?${config.twitch.username}`, 'gi')
                const textWithoutMention = text.replace(regex, '').trim()
                return await handlers.openAI.askOpenAI(target, textWithoutMention, context.userInfo.displayName, this.twitchBot)
            }

            if (textSplit.length > 0 && inputParser.isAskingToUploadChatToOpenAI(textSplit[0]) && isAdmin(context))
                return await handlers.openAI.createAndUploadToChat(target, this.twitchBot, true)

            if (textSplit.length > 0 && inputParser.isAskingToUploadStreamToOpenAI(textSplit[0]) && isAdmin(context))
                return await handlers.openAI.uploadStreamToOpenai(target, this.twitchBot, true)

        } catch (error) {
            logger.error(`Error in handleText: ${error.message}`)
            logger.error(error.stack)
        }
    }

    handleConnect () {
        logger.info(`* Connected to twitch irc`)
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
