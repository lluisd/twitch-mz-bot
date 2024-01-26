module.exports = {
    port: process.env.PORT || 443,
    twitch: {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_PASSWORD,
        channels: process.env.TIWTCH_CHANNELS
    }
}
