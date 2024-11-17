const TelegramBot = require('node-telegram-bot-api')
const config = require('../config')
const cron = require('node-cron')
const handlers = require('../handlers')
const TwitchService = require('../services/twitch')

class Notifier {
    constructor (twitchBot) {
        this.target = `#${config.twitch.channels}`
        this.twitchBot = twitchBot
        this.bot = new TelegramBot(config.telegram.apiKey)
    }

    notify () {
        cron.schedule('*/1 * * * *', async () => {
            await handlers.stream.catchStream(this.bot, this.twitchBot, this.target)
        })

        cron.schedule('5 * * * *', async () => {
            await handlers.stream.sendTodayBirthday(this.twitchBot, this.target)
        })

        cron.schedule('0/30 * * * *', async () => {
            await handlers.stream.refreshPage()
        })

        cron.schedule('0 * * * *', async () => {
            await handlers.events.sendTarracoMangaEvent()
        })

        cron.schedule('0 4 * * *', async () => {
            await handlers.ban.updateBansList()
        })

        cron.schedule('15 4 * * *', async () => {
            await handlers.openAI.createAndUploadToChat(this.target, this.twitchBot)
        })

        cron.schedule('30 * * * *', async () => {
            const channel = await TwitchService.getChannel()
            if (channel.live) {
                const text = 'como si fueras un usuario del chat de forma aleatoria alguna curiosidad del streamer o de su chat anecdótica o de dato curioso para compartir'
                await handlers.openAI.askOpenAI(this.target, text, null, this.twitchBot)
            }
        })

        return Promise.resolve()
    }

    getBot () {
        return this.bot
    }
}

module.exports = Notifier
