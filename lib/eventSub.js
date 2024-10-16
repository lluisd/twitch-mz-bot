const {EventSubMiddleware} = require("@twurple/eventsub-http");
const config = require("../config");

class EventSub {
    constructor() {}

    init (apiClient, bot) {
        this.bot = bot
        this.middleware = new EventSubMiddleware({
            apiClient,
            hostName: config.twitch.hostname,
            pathPrefix: '/twitch',
            secret: config.twitch.eventSubSecret,
            strictHostCheck: false
        })
    }

    getMiddleware () {
        return this.middleware
    }

    apply (app) {
        this.middleware.apply(app)
    }

    async markAsReady () {
        await this.middleware.markAsReady()
    }

    async subscribeEvent (channelId) {
        this.middleware.onChannelFollow(channelId, config.twitch.userId, event => {
            console.log(`${event.userDisplayName} just followed ${event.broadcasterDisplayName}!`);
            this.bot.say(`#${config.twitch.channels}`, `Gracias por seguirnos ${event.userDisplayName}!`)
        });

        this.middleware.onChannelRedemptionAddForReward(channelId, "427b3e63-e6cd-4d36-8954-9c7198af0a1d", event => {
            console.log(`${event.userDisplayName} ha canjeado ${event.rewardTitle}!`);
            this.bot.say(`#${config.twitch.channels}`, `${event.userDisplayName} ha canjeado ${event.rewardTitle}!`)
        });
    }
}

module.exports = EventSub

