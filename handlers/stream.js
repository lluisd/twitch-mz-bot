const TwitchService = require('../services/twitch')
const config = require("../config");
const moment = require('moment')
require('moment-precise-range-plugin')

const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async catchStream (bot) {
        const result = await TwitchService.getStream()

        if (result && result.type === 'live' ) {
            const text = this._getText(result)

            const options = {
                parse_mode: 'Markdown'
            }

            await bot.sendMessage(config.telegram.chatId, text, options).then((msg) => {
                     TwitchService.saveLastMessage(msg)
                     TwitchService.saveTitle(result.title)
                })
        } else if (result && result.type === 'finished' && result.messageId) {
            await bot.deleteMessage(config.telegram.chatId, result.messageId)
            await TwitchService.deleteLastMessage()
            await TwitchService.saveTitle(result.title)
        } else if (result && result.type === 'stillLive' && result.messageId && (result.lastTitle !== result.title || (result.lastUpdate && moment().diff(moment(result.lastUpdate)) > 300000))) {
            const options = {
                chat_id: config.telegram.chatId,
                message_id: result.messageId,
                parse_mode: 'Markdown'
            }
            try {
                await bot.editMessageText(this._getText(result), options)
            } catch {
                console.log('error')
            }
            await TwitchService.saveTitle(result.title)
        }
    }

    _getText (stream) {
        const end = moment()
        const start = moment(stream.started_at)
        const diff = moment.preciseDiff(start, end, true)
        const horas = diff.hours > 0 ? `${diff.hours} horas ` : ''
        const duration = `${horas}${diff.minutes} minutos`

        const width = Math.floor(Math.random() * (1280 - 1000 + 1) + 1000)
        const height = width / (16/9)
        const image = `[\u200c](${stream.thumbnail_url.replace('-{width}x{height}', `-${width}x${height}`)})`
        const link = `[${twitchUrl}${stream.user_name}](${twitchUrl}${stream.user_name})`
        const title = `🔴 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.title}_ (${duration})`
    }
}

module.exports = Stream
