const TwitchService = require('../services/twitch')
const BrowserService = require('../services/browser')
const BirthdayService = require('../services/birthday')
const ScreenshotService = require('../services/screenshot')
const LoggerService = require('../services/logger')
const config = require("../config")
const moment = require('moment')
require('moment-precise-range-plugin')
require('mathjs')
const randomLinks = require("../config/randomLinks.json");

const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async refreshPage() {
        await BrowserService.refreshPage().catch(() => { console.error('refreshPage on refreshPage')})
    }

    async changeTitle(title) {
        await TwitchService.setTitle(title).catch(() => { console.error('setTitle on changeTitle')})
    }

    async changeCategory(name) {
        await TwitchService.setGame(name).catch(() => { console.error('setGame on changeCategory')})
    }

    async setNotifyChannelFollowMessage(value) {
        const valueNumber = parseInt(value)
        if (typeof valueNumber === 'number') {
            await TwitchService.setNotifyChannelFollowMessage(!!valueNumber).catch(() => { console.error('setNotifyChannelFollowMessage on setNotifyChannelFollowMessage')})
        }
    }

    async getScreenshots(target, bot) {
        bot.say(target, `Fotos del stream ${config.externalUrl}/stream`)
    }

    async captureScreenshot(target, bot, notifierBot, displayName, roomId) {
        const image = await BrowserService.getScreenshot().catch(() => { console.error('getScreenshot on captureScreenshot')})
        if (image) {

            await bot.say(target, `Captura de ${displayName}: ${config.externalUrl}/i/${image.fileName}`)
            const channel = await TwitchService.getChannel()
            await ScreenshotService.addScreenshot(image.fileName, channel.streamId, displayName, roomId)


            // if (channel.live) {
            //     await notifierBot.sendPhoto(config.telegram.chatId, image.buffer, {
            //         caption: `Captura del directo _${channel.title}_ \n por *${user}*`,
            //         parse_mode: 'Markdown'
            //     })
            // }
        }
    }

    async catchStream (telegramBot, twitchBot, target) {
        const result = await TwitchService.getStream()
        await this._logStreamTitle(result)
        if (result && result.type === 'live' ) {
            await this.sendTodayBirthday(twitchBot, target)
            const text = this._getText(result)
            const options = { parse_mode: 'Markdown' }
            const msg = await telegramBot.sendMessage(config.telegram.chatId, text, options)
            await telegramBot.pinChatMessage(config.telegram.chatId, msg.message_id).catch((err) => { console.error(`cannot pin chat: ${err}`)})
            await TwitchService.saveLastMessage(msg)
            await BrowserService.startAndWarmUpBrowserIfNeeded().catch(() => { console.error('startAndWarmUpBrowserIfNeeded on live')})
        } else if (result && result.type === 'finished' && result.messageId) {
            await telegramBot.unpinChatMessage(config.telegram.chatId, {message_id: result.messageId}).catch((err) => { console.error(`cannot unpin chat: ${err}`)})
            await telegramBot.deleteMessage(config.telegram.chatId, result.messageId).catch((err) => { console.error(`cannot delete message: ${err}`)})
            await this._sendStreamScreenshots(telegramBot, result.streamId)
            await BrowserService.closeBrowser().catch(() => { console.error('closeBrowser on finished')})
        } else if (result && result.type === 'stillLive' && result.messageId && (result.lastTitle !== result.title || (result.lastUpdate && moment().diff(moment(result.lastUpdate)) > 300000))) {
            const options = {
                chat_id: config.telegram.chatId,
                message_id: result.messageId,
                parse_mode: 'Markdown'
            }
            console.log('still alive' + this._getText(result))
            await TwitchService.saveLastUpdate()
            await telegramBot.editMessageText(this._getText(result), options).catch((err) => { console.error(`cannot edit message: ${err}`)})
            await BrowserService.startAndWarmUpBrowserIfNeeded().catch(() => { console.error('startAndWarmUpBrowserIfNeeded on stillLive')})
        } else if (result && result.type === 'notLive') {
            await BrowserService.closeBrowserIfNeeded().catch(() => { console.error('closeBrowserIfNeeded on notLive')})
        }
    }

    _getText (stream) {
        const end = moment()
        const start = moment(stream.started_at)
        const diff = moment.preciseDiff(start, end, true)
        const horas = diff.hours > 0 ? `${diff.hours} horas ` : ''
        const duration = `${horas}${diff.minutes} minutos`

        const width = Math.floor(Math.random() * (1280 - 1000 + 1) + 1000)
        const height = Math.trunc(width / (16/9))
        const image = `[\u200c](${stream.thumbnail_url.replace('-{width}x{height}', `-1280x720`)}?a=${Date.now()})`
        const link = `[${twitchUrl}${stream.user_name}](${twitchUrl}${stream.user_name})`
        const title = `🔴 *¡EN DIRECTO!*`
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
            twitchBot.say(target, text)
        }
    }

    async _sendStreamScreenshots(telegramBot, streamId) {
        const screenshots = await ScreenshotService.getScreenshots(streamId)
        console.log('sending images: ' + screenshots.length)
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
                        console.log('sending chunk: ' + ind + 'with photos' + p.map(photo => photo.media).join(', '))
                        await telegramBot.sendMediaGroup(config.telegram.chatId, p, { disable_notification: true }).catch((err) => {
                            console.log(err.code)
                            console.log(err.response?.body)
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
            await LoggerService.logStreamTitle(result.user_id, result.title)
        }

    }


}

module.exports = Stream
