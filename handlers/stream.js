const TwitchService = require('../services/twitch')
const config = require("../config");

const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async catchStream (bot) {
        const result = await TwitchService.getStream()

        if (result && result.type === 'live') {
            const image = `[\u200c](${result.thumbnail_url.replace('-{width}x{height}', '')})`
            const link = `[${twitchUrl}${result.user_name}](${twitchUrl}${result.user_name})`
            const directo = `*¡EN DIRECTO!*`
            const text = `${image} ${directo}  ${link}`

            const options = {
                parse_mode: 'markdown'
            }

            await bot.sendMessage(config.telegram.chatId, text, options).then((msg) => {
                     TwitchService.saveLastMessage(msg)
                })
        } else if (result && result.type === 'finished' && result.messageId) {
            await bot.deleteMessage(config.telegram.chatId, result.messageId)
            await TwitchService.deleteLastMessage()
        }
    }
}

module.exports = Stream
