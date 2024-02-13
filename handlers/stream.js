const TwitchService = require('../services/twitch')
const BrowserService = require('../services/browser')
const config = require("../config")
const moment = require('moment')
require('moment-precise-range-plugin')
require('mathjs')

const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async refreshPage() {
        await BrowserService.refreshPage().catch(() => { console.error('refreshPage on refreshPage')})
    }
    async captureScreenshot(target, bot, notifierBot, user) {
        const image = await BrowserService.getScreenshot().catch(() => { console.error('getScreenshot on captureScreenshot')})
        if (image) {
            const channel = await TwitchService.getChannel()
            await bot.say(target, `Captura de ${user}: ${config.externalUrl}/images/${image.fileName}`)
            // if (channel.live) {
            //     await notifierBot.sendPhoto(config.telegram.chatId, image.buffer, {
            //         caption: `Captura del directo _${channel.title}_ \n por *${user}*`,
            //         parse_mode: 'Markdown'
            //     })
            // }
        }
    }

    async catchStream (bot) {
        const result = await TwitchService.getStream()

        if (result && result.type === 'live' ) {
            const text = this._getText(result)

            const options = {
                parse_mode: 'Markdown'
            }

            const msg = await bot.sendMessage(config.telegram.chatId, text, options)
            await bot.pinChatMessage(config.telegram.chatId, msg.messageId).catch(() => {})
            await TwitchService.saveLastMessage(msg)
            await TwitchService.saveTitle(result.title)
            await BrowserService.startAndWarmUpBrowserIfNeeded().catch(() => { console.error('startAndWarmUpBrowserIfNeeded on live')})

        } else if (result && result.type === 'finished' && result.messageId) {
            await bot.deleteMessage(config.telegram.chatId, result.messageId)
            await TwitchService.deleteLastMessage()
            await TwitchService.saveTitle(result.title)
            await BrowserService.closeBrowser().catch(() => { console.error('closeBrowser on finished')})
        } else if (result && result.type === 'stillLive' && result.messageId && (result.lastTitle !== result.title || (result.lastUpdate && moment().diff(moment(result.lastUpdate)) > 300000))) {
            const options = {
                chat_id: config.telegram.chatId,
                message_id: result.messageId,
                parse_mode: 'Markdown'
            }
            await bot.editMessageText(this._getText(result), options).catch(() => {})
            await TwitchService.saveTitle(result.title)
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
}

module.exports = Stream
