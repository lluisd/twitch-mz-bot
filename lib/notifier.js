const TelegramBot = require('node-telegram-bot-api')
const config = require('../config')
const cron = require('node-cron')
const handlers = require('../handlers')

class Notifier {
    constructor () {
        this.bot = new TelegramBot(config.telegram.apiKey)
    }

    notify () {
        cron.schedule('*/1 * * * *', () => {
            handlers.stream.catchStream(this.bot)
        })

        return Promise.resolve()
    }

    getBot () {
        return this.bot
    }
}

module.exports = Notifier
