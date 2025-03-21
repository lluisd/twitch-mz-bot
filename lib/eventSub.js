const {EventSubMiddleware} = require("@twurple/eventsub-http");
const config = require("../config");
const broadcasterApiClient = require('../broadcasterApiClient')
const TwitchService = require("../services/twitch");
const WhisperService = require("../services/whisper");

class EventSub {
    constructor() {}

    async init (bot) {
        const apiClient = await broadcasterApiClient.getApiClient()
        this.bot = bot
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
            console.log(`${event.userDisplayName} just followed ${event.broadcasterDisplayName}!`);
            const channel = await TwitchService.getChannel()
            if (channel.notifyChannelFollowMessage) {
                this.bot.say(`#${config.twitch.channels}`, `Gracias por seguirnos @${event.userDisplayName}!`)
            }
        })

        this.middleware.onChannelRedemptionAddForReward(channelId, "427b3e63-e6cd-4d36-8954-9c7198af0a1d", event => {
            console.log(`${event.userDisplayName} ha canjeado ${event.rewardTitle}!`);
            this.bot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha canjeado ${event.rewardTitle}!`)
        })

        this.middleware.onChannelSubscription(channelId, event => {
            console.log(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            if (!event.isGift) {
                this.bot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} se ha suscrito!`)
            }
        })

        this.middleware.onChannelSubscriptionGift(channelId, event => {
            console.log(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            this.bot.say(`#${config.twitch.channels}`, `@${event.gifterDisplayName} ha regalado ${event.amount} subs!`)
        })

        this.middleware.onChannelRaidTo(channelId, event => {
            console.log(`${event.raidingBroadcasterDisplayName} raided to the channel with ${event.viewers} viewers!`);
            this.bot.say(`#${config.twitch.channels}`, `Raid con ${event.viewers} viewers de @${event.raidingBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelRaidFrom(channelId, event => {
            console.log(`${event.raidedBroadcasterDisplayName} raiding with ${event.viewers} viewers!`);
            this.bot.say(`#${config.twitch.channels}`, `Raid a @${event.raidedBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelBan(channelId, async event => {
            console.log(`${event.moderatorDisplayName} banned ${event.userDisplayName}!`);
            if (event.moderatorId !== "402337290") {
                if (event.isPermanent) {
                    this.bot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha mordido el polvo!`)
                } else {
                    this.bot.say(`#${config.twitch.channels}`, `Timeout para que @${event.userDisplayName} se calme!`)
                }
            }
            await TwitchService.addBan(channelId, event.userId, event.userName, event.moderatorName, event.reason, event.startDate, event.endDate)
        })

        this.middleware.onChannelUnban(channelId, async event => {
            await TwitchService.removeBan(channelId, event.userName)
        })

        this.middleware.onChannelPollBegin(channelId, event => {
            console.log(`Poll ${event.title} has started!`);
            this.bot.say(`#${config.twitch.channels}`, `Encuesta iniciada: ${event.title}, vota!`)
        })

        this.middleware.onStreamOnline(channelId, async event => {
            console.log(`Stream ${event.broadcasterDisplayName} has started!`);
            await WhisperService.start()
            this.bot.say(`#${config.twitch.channels}`, `online`)
        })

        this.middleware.onStreamOffline(channelId, async event => {
            console.log(`Stream ${event.broadcasterDisplayName} has ended!`);
            await WhisperService.stop()
            this.bot.say(`#${config.twitch.channels}`, `offline`)
        })
    }
}

module.exports = EventSub

