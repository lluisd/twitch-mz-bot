const TwitchService = require('../services/twitch')
const config = require("../config");

const twitchUrl = 'https://www.twitch.tv/'

class Stream {
    async catchStream (bot) {
        const result = await TwitchService.getStream()

        if (result) {
            const image = `[\u200c](${result.thumbnail_url.replace('-{width}x{height}', '')})`
            const link = `[${twitchUrl}${result.user_name}](${twitchUrl}${result.user_name})`
            const directo = `*¡EN DIRECTO!*`
            const text = `${image} ${directo}  ${link}`

            const options = {
                parse_mode: 'markdown'
            }

            bot.sendMessage(config.telegram.chatId, text, options)
        }

        // {
        //     "id": "40400588869",
        //     "user_id": "779563374",
        //     "user_login": "manzana_oscura",
        //     "user_name": "manzana_oscura",
        //     "game_id": "516575",
        //     "game_name": "VALORANT",
        //     "type": "live",
        //     "title": "aver si veo por donde me matan",
        //     "viewer_count": 8,
        //     "started_at": "2024-02-02T12:05:37Z",
        //     "language": "es",
        //     "thumbnail_url": "https://static-cdn.jtvnw.net/previews-ttv/live_user_manzana_oscura-{width}x{height}.jpg",
        //     "tag_ids": [],
        //     "tags": [
        //     "PequeñaGranComunidad",
        //     "PreguntaYRespondo",
        //     "lectura",
        //     "ASMR",
        //     "Relajacion",
        //     "Meditacion",
        //     "Español",
        //     "English"
        // ],
        //     "is_mature": false
        // }
    }
}

module.exports = Stream
