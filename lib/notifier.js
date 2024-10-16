const TelegramBot = require('node-telegram-bot-api')
const config = require('../config')
const cron = require('node-cron')
const handlers = require('../handlers')
const TwitchService = require("../services/twitch");

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

        return Promise.resolve()
    }

    getBot () {
        return this.bot
    }
}

module.exports = Notifier
