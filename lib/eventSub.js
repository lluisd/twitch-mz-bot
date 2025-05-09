const {EventSubMiddleware} = require("@twurple/eventsub-http");
const config = require("../config");
const broadcasterApiClient = require('../broadcasterApiClient')
const TwitchService = require("../services/twitch");
const WhisperService = require("../services/whisper");
const logger = require('../lib/logger')

class EventSub {
    constructor() {}

    async init (twitchBot, telegramBot) {
        const apiClient = await broadcasterApiClient.getApiClient()
        this.twitchBot = twitchBot
        this.telegramBot = telegramBot
        this.middleware = new EventSubMiddleware({
            apiClient,
            hostName: config.twitch.hostname,
            pathPrefix: '/twitch',
            secret: config.twitch.eventSubSecret,
            strictHostCheck: false
        })
    }

    apply (app) {
        this.middleware.apply(app)
    }

    async markAsReady () {
        await this.middleware.markAsReady()
    }

    async subscribeEvent (channelId) {
        this.middleware.onChannelFollow(channelId, config.twitch.userId, async event => {
            logger.info(`${event.userDisplayName} just followed ${event.broadcasterDisplayName}!`);
            const channel = await TwitchService.getChannel()
            if (channel.notifyChannelFollowMessage) {
                await this.twitchBot.say(`#${config.twitch.channels}`, `Gracias por seguirnos @${event.userDisplayName}!`)
            }
        })

        this.middleware.onChannelRedemptionAddForReward(channelId, "427b3e63-e6cd-4d36-8954-9c7198af0a1d", async event => {
            logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha canjeado ${event.rewardTitle}!`)
        })

        this.middleware.onChannelSubscription(channelId, async event => {
            logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            if (!event.isGift) {
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} se ha suscrito!`)
            }
        })

        this.middleware.onChannelSubscriptionGift(channelId, async event => {
            logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.gifterDisplayName} ha regalado ${event.amount} subs!`)
        })

        this.middleware.onChannelRaidTo(channelId, async event => {
            logger.debug(`${event.raidingBroadcasterDisplayName} raided to the channel with ${event.viewers} viewers!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Raid con ${event.viewers} viewers de @${event.raidingBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelRaidFrom(channelId, async event => {
            logger.debug(`${event.raidedBroadcasterDisplayName} raiding with ${event.viewers} viewers!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Raid a @${event.raidedBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelBan(channelId, async event => {
            logger.debug(`${event.moderatorDisplayName} banned ${event.userDisplayName}!`);
            if (event.moderatorId !== "402337290") {
                if (event.isPermanent) {
                    const message = `🔨 @${event.userDisplayName} ha mordido el polvo!`;
                    await this.twitchBot.say(`#${config.twitch.channels}`, message)
                    await this.telegramBot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' })
                } else {
                    await this.twitchBot.say(`#${config.twitch.channels}`, `Timeout para que @${event.userDisplayName} se calme!`)
                }
            }
            await TwitchService.addBan(channelId, event.userId, event.userName, event.moderatorName, event.reason, event.startDate, event.endDate)
        })

        this.middleware.onChannelUnban(channelId, async event => {
            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} desbaneado`)
            await TwitchService.removeBan(channelId, event.userId)
        })

        this.middleware.onChannelPollBegin(channelId, async event => {
            logger.debug(`Poll ${event.title} has started!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Encuesta iniciada: ${event.title}, vota!`)
        })

        this.middleware.onStreamOnline(channelId, async event => {
            logger.debug(`Stream ${event.broadcasterDisplayName} has started!`);
            await WhisperService.start()
            await this.twitchBot.say(`#${config.twitch.channels}`, `online`)
        })

        this.middleware.onStreamOffline(channelId, async event => {
            logger.debug(`Stream ${event.broadcasterDisplayName} has ended!`);
            await WhisperService.stop()
            await this.twitchBot.say(`#${config.twitch.channels}`, `offline`)
        })
    }
}

module.exports = EventSub

