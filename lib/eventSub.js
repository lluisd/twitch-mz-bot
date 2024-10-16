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
            bot.say(`#${config.twitch.channels}`, `Gracias por seguirnos ${event.userDisplayName}!`)
        });
    }
}

module.exports = EventSub
