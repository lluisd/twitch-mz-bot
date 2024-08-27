module.exports = {
    externalUrl: process.env.EXTERNAL_URL,
    database: process.env.MONGODB_URI,
    twitch: {
        channels: process.env.TWITCH_CHANNELS,
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        userId: process.env.TWITCH_USER_ID,
        roomId: process.env.TWITCH_ROOM_ID
    },
    aemet: {
        apiKey: process.env.AEMET_API_KEY
    },
    telegram: {
        apiKey: process.env.TELEGRAM_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    browserless: {
        url: process.env.BROWSERLESS_URL,
        token: process.env.BROWSERLESS_TOKEN,
        version: process.env.BROWSERLESS_VERSION
    },
    statusUrl: process.env.STATUS_URL,
    whitelistAdmins: process.env.WHITE_LIST_ADMINS.split(','),
    whitelistEditors: process.env.WHITE_LIST_EDITORS.split(',')
}
