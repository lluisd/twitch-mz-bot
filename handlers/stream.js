const TwitchService = require('../services/twitch')
const config = require("../config");

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
        } else if (result && result.type === 'stillLive' && result.messageId && result.lastTitle !== result.title) {
            const options = {
                chat_id: config.telegram.chatId,
                message_id: result.messageId,
                parse_mode: 'Markdown'
            }
            try {
                await bot.editMessageText(this._getText(result), options)
            } catch {}
            await TwitchService.saveTitle(result.title)
        }
    }

    _getText (stream) {
        const image = `[\u200c](${stream.thumbnail_url.replace('-{width}x{height}', '')})`
        const link = `[${twitchUrl}${stream.user_name}](${twitchUrl}${stream.user_name})`
        const title = `🔴 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.title}_`
    }
}

module.exports = Stream
