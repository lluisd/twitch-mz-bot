module.exports = {
    externalUrl: process.env.EXTERNAL_URL,
    database: process.env.MONGODB_URI,
    twitch: {
        channels: process.env.TWITCH_CHANNELS,
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        userId: process.env.TWITCH_USER_ID
    },
    aemet: {
        apiKey: process.env.AEMET_API_KEY
    },
    telegram: {
        apiKey: process.env.TELEGRAM_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    browserlessUrl: process.env.BROWSERLESS_URL,
    mariadb: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        db: process.env.MYSQL_DB
    },
    statusUrl: process.env.STATUS_URL
}
