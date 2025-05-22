const config = require('../config')
const cron = require('node-cron')
const handlers = require('../handlers')
const TwitchService = require('../services/twitch')
const logger = require('../lib/logger')

class Notifier {
    constructor (twitchBot, telegramBot) {
        this.target = `#${config.twitch.channels}`
        this.twitchBot = twitchBot
        this.telegramBot = telegramBot
    }

    notify () {
        cron.schedule('*/1 * * * *', async () => {
            try {
                await handlers.stream.catchStream(this.telegramBot, this.twitchBot, this.target)
                await handlers.ban.unbanExpiredTimeouts()
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('5 * * * *', async () => {
            try {
                await handlers.stream.sendTodayBirthday(this.twitchBot, this.target)
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('*/30 * * * *', async () => {
            try {
                if (config.features.TFSpots) {
                    await handlers.tempsDeFlors.getNotification(this.twitchBot, this.target)
                }
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('0/30 * * * *', async () => {
            try {
                await handlers.stream.refreshPage()
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('0 * * * *', async () => {
            try {
                await handlers.events.sendTarracoMangaEvent()
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('0 4 * * *', async () => {
            try {
                await handlers.ban.updateBansList()
            } catch (err) {
                logger.error(err)
            }
        })


        cron.schedule('2 4 * * *', async () => {
            try {
                await handlers.ban.updateBlocksList()
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('15 4 * * *', async () => {
            try {
                await handlers.openAI.createAndUploadToChat(this.target, this.twitchBot)
            } catch (err) {
                logger.error(err)
            }
        })

        cron.schedule('40 * * * *', async () => {
            try {
                const channel = await TwitchService.getChannel()
                if (channel.live) {
                    const text = 'como si fueras un usuario del chat de forma aleatoria alguna curiosidad reciente del streamer o de su chat anecdótica o de dato curioso para compartir que no hayas dicho antes'
                    await handlers.openAI.askOpenAI(this.target, text, null, this.twitchBot)
                }
            } catch (err) {
                logger.error(err)
            }
        })

        return Promise.resolve()
    }
}

module.exports = Notifier
