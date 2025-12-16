const TwitchService = require('../services/twitch')
const ImmuneService = require('../services/immune')
const BrowserService = require('../services/browser')
const BirthdayService = require('../services/birthday')
const ScreenshotService = require('../services/screenshot')
const LoggerService = require('../services/logger')
const config = require("../config")
const moment = require('moment')
require('moment-precise-range-plugin')
require('mathjs')
const { photoSemaphore } = require("../semaphore.js")
const logger = require('../lib/logger')
const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async refreshPage() {
        if (photoSemaphore.isLocked()) {
            return;
        }
        const [value, release] = await photoSemaphore.acquire()
        try {
            await BrowserService.refreshPage().catch(() => {
                logger.error('refreshPage on refreshPage')
            })
        } finally {
            release()
        }
    }

    async addVip (username) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.addVip(user.id)
            logger.info(`Added vip to ${username}`)
        }
    }

    async removeVip (username) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.removeVip(user.id)
            logger.info(`Removed vip from ${username}`)
        }
    }

    async addMod (username) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.addMod(user.id)
            logger.info(`Added mod to ${username}`)
        }
    }

    async removeMod (username) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.removeMod(user.id)
            logger.info(`Removed mod from ${username}`)
        }
    }

    async changeTitle(title) {
        await TwitchService.setTitle(title).catch(() => { logger.error('setTitle on changeTitle')})
    }

    async changeCategory(name) {
        await TwitchService.setGame(name).catch(() => { logger.error('setGame on changeCategory')})
    }

    async setNotifyChannelFollowMessage(value) {
        const valueNumber = parseInt(value)
        if (!isNaN(valueNumber)){
            await TwitchService.setNotifyChannelFollowMessage(!!valueNumber).catch(() => { logger.error('setNotifyChannelFollowMessage on setNotifyChannelFollowMessage')})
        }
    }

    async getVips(target, bot) {
        const vips = await TwitchService.getVips()
        if (vips && vips.length > 0) {
            await bot.say(target, `Hay ${vips.length} vips. Detalles en ${config.externalUrl}/vips`)
        } else {
            await bot.say(target, 'No hay vips')
        }
    }

    async getMods(target, bot) {
        const mods = await TwitchService.getMods()
        if (mods && mods.length > 0) {
            await bot.say(target, `Hay ${mods.length} mods. Detalles en ${config.externalUrl}/mods`)
        } else {
            await bot.say(target, 'No hay mods')
        }
    }

    async getImmunes(target, bot) {
        const immunes = await ImmuneService.getImmunes()

        if (immunes && immunes.length > 0) {
            const immunesDetails = await Promise.all(
                immunes.map(immune => TwitchService.getUserById(immune.userId))
            );

            await bot.say(target, `Actuales immunes 24h: ${immunesDetails.map(u => u.displayName ).join(', ').replace(/, ([^,]*)$/, ' y $1')}. Detalles en ${config.externalUrl}/immunes`)
        } else {
            await bot.say(target, 'No hay immunes 24h')
        }
    }

    async setImmunity(value) {
        const valueNumber = parseInt(value)
        if (!isNaN(valueNumber)){
            await TwitchService.setImmunity(!!valueNumber).catch(() => { logger.error('setImmunity on setImmunity')})
        }
    }

    async getScreenshots(target, bot) {
        await bot.say(target, `Fotos del reto Temps de Flors ${config.externalUrl}/fotos`)
    }

    async captureScreenshot(target, bot, displayName, roomId) {
        if (photoSemaphore.isLocked()) {
            return
        }
        const [value, release] = await photoSemaphore.acquire()
        try {
            const image = await BrowserService.getScreenshot().catch(() => {
                logger.error('getScreenshot on captureScreenshot')
            })
            if (image) {

                await bot.say(target, `Captura de ${displayName}: ${config.externalUrl}/i/${image.fileName}`)
                const channel = await TwitchService.getChannel()
                await ScreenshotService.addScreenshot(image.fileName, channel.streamId, displayName, roomId)
                await BrowserService.refreshPage()
            }
        } finally {
            release()
        }
    }

    async catchStream (telegramBot, twitchBot, target) {
        const result = await TwitchService.getStream()
        await this._logStreamTitle(result)
        logger.debug('catch stream type: ' + result.data.type)
        if (result && result.data && result.data.type === 'live') {
            await this.sendTodayBirthday(twitchBot, target)
            const text = this._getText(result.stream)
            const options = { parse_mode: 'Markdown' }
            const msg = await telegramBot.sendMessage(config.telegram.chatId, text, options)
            await telegramBot.pinChatMessage(config.telegram.chatId, msg.message_id).catch((err) => { logger.error(`cannot pin chat: ${err}`)})
            await TwitchService.saveLastMessage(msg)
            await BrowserService.startAndWarmUpBrowserIfNeeded().catch(() => { logger.error('startAndWarmUpBrowserIfNeeded on live')})
        } else if (result && result.data && result.data.type === 'finished' && result.data.messageId) {
            await telegramBot.unpinChatMessage(config.telegram.chatId, {message_id: result.data.messageId}).catch((err) => { logger.error(`cannot unpin chat: ${err}`)})
            await telegramBot.deleteMessage(config.telegram.chatId, result.data.messageId).catch((err) => { logger.error(`cannot delete message: ${err}`)})
            await this._sendStreamScreenshots(telegramBot, result.data.streamId)
            await BrowserService.closeBrowser().catch(() => { logger.error('closeBrowser on finished')})
        } else if (result && result.data && result.stream && result.data.type === 'stillLive' && result.data.messageId &&
            (result.data.lastTitle !== result.stream.title || (result.data.lastUpdate && moment().diff(moment(result.data.lastUpdate)) > 300000))) {
            const options = {
                chat_id: config.telegram.chatId,
                message_id: result.data.messageId,
                parse_mode: 'Markdown'
            }
            logger.info('still alive' + this._getText(result.stream))
            await TwitchService.saveLastUpdate()
            await telegramBot.editMessageText(this._getText(result.stream), options).catch((err) => { logger.error(`cannot edit message: ${err}`)})
            await BrowserService.startAndWarmUpBrowserIfNeeded().catch(() => { logger.error('startAndWarmUpBrowserIfNeeded on stillLive')})
        } else if (result && result.data && result.data.type === 'notLive') {
            await BrowserService.closeBrowserIfNeeded().catch(() => { logger.error('closeBrowserIfNeeded on notLive')})
        }
    }

    _getText (stream) {
        const end = moment()
        const start = moment(stream.startDate)
        const diff = moment.preciseDiff(start, end, true)
        const horas = diff.hours > 0 ? `${diff.hours} horas ` : ''
        const duration = `${horas}${diff.minutes} minutos`

        const width = Math.floor(Math.random() * (1280 - 1000 + 1) + 1000)
        const height = Math.trunc(width / (16/9))
        const image = `[\u200c](${stream.thumbnailUrl.replace('-{width}x{height}', `-1280x720`)}?a=${Date.now()})`
        const link = `[${twitchUrl}${stream.userName}](${twitchUrl}${stream.userName})`
        const title = `🟣 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.title}_ (${duration})`
    }

    async sendTodayBirthday(twitchBot, target) {
        const bdays  = await BirthdayService.getTodayBirthdays()
        if (bdays && bdays.length > 0) {
            let text
            if (bdays.length === 1){
                text = this._getTodayBdayText(`${bdays[0].nick}`)
            } else if (bdays.length > 1) {
                const nicks = bdays.map(bday => `${bday.nick}`).join(', ').replace(/, ([^,]*)$/, ' y $1')
                text = this._getTodayBdaysText(nicks)
            }
            await twitchBot.say(target, text)
        }
    }

    async _sendStreamScreenshots(telegramBot, streamId) {
        const screenshots = await ScreenshotService.getScreenshots(streamId)
        logger.info('sending images: ' + screenshots.length)
        if (screenshots && screenshots.length > 1) {
            const chunkSize = 10
            let index = 0
            for (let i = 0; i < screenshots.length; i += chunkSize) {
                index++
                const chunk = screenshots.slice(i, i + chunkSize)
                const photos = chunk.map(s =>(
                    {
                        type: "photo",
                        media:  `${config.externalUrl}/images/${s.name}.jpg`,
                        caption: `Captura de *${s.capturedBy}*`,
                        parse_mode: 'Markdown'
                    }));
                ((ind, p) => {
                    setTimeout(async () => {
                        logger.info('sending chunk: ' + ind + 'with photos' + p.map(photo => photo.media).join(', '))
                        await telegramBot.sendMediaGroup(config.telegram.chatId, p, { disable_notification: true }).catch((err) => {
                            logger.error(err.code)
                            logger.error(err.response?.body)
                        })
                    }, 65000 * ind);
                })(index, photos);
            }
        } else if (screenshots && screenshots.length === 1) {
            await telegramBot.sendPhoto(config.telegram.chatId,  `${config.externalUrl}/images/${screenshots[0].name}.jpg`, {
                caption: `Captura de *${screenshots[0].capturedBy}*`,
                parse_mode: 'Markdown'
            })
        }
    }

    _getTodayBdaysText(nicks) {
        return `¡${nicks} cumplen años hoy!`
    }

    _getTodayBdayText(nick) {
        return `¡${nick} cumple años hoy!`
    }

    async _logStreamTitle(result) {
        if ((result.type === 'live' || result.type === 'stillLive') && result.lastTitle !== result.title ) {
            await LoggerService.logStreamTitle(result.userId, result.title)
        }
    }
}

module.exports = Stream
