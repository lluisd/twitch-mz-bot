module.exports = {
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
    sql : {
        connectionString: process.env.SQL_CONNECTION
    }
}
