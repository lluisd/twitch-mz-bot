module.exports = {
    externalUrl: process.env.EXTERNAL_URL,
    database: process.env.MONGODB_URI,
    twitch: {
        channels: process.env.TWITCH_CHANNELS,
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        userId: process.env.TWITCH_USER_ID,
        roomId: process.env.TWITCH_ROOM_ID,
        username: process.env.TWITCH_USER_NAME,
        eventSubSecret: process.env.TWITCH_EVENTSUB_SECRET,
        hostname: process.env.TWITCH_HOSTNAME,
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
    whitelistAdmins: process.env.WHITE_LIST_ADMINS?.split(',') ?? [],
    whitelistEditors: process.env.WHITE_LIST_EDITORS?.split(',') ?? [],
    blacklistUsers: process.env.BLACK_LIST_USERS?.split(',') ?? [],
    whitelistUsers: process.env.WHITE_LIST_USERS?.split(',') ?? [],
    features: {
        TFSpots: process.env.FEATURE_TF_SPOTS === 'true',
    },
    openAI: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        endpoint_base: process.env.AZURE_OPENAI_ENDPOINT_BASE,
        key: process.env.AZURE_OPENAI_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION,
        database: process.env.OPENAI_MONGODB_URI,
        vectorStoreId: process.env.AZURE_OPENAI_VECTOR_STORE_ID,
        assistantId: process.env.AZURE_OPENAI_ASSISTANT_ID
    },
    whisper: {
        endpoint: process.env.WHISPER_ENDPOINT,
    },
    blobStorage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME
    },
    ha: {
        apiKey: process.env.HA_API_KEY,
        endpoint: process.env.HA_ENDPOINT
    },
    loki: {
        basicAuth: process.env.LOKI_BASIC_AUTH,
        host: process.env.LOKI_HOST,
    },
    basicAuth: {
        username: process.env.BASIC_AUTH_USERNAME,
        password: process.env.BASIC_AUTH_PASSWORD
    },
    customReward: {
        buyVip: process.env.CUSTOM_REWARD_BUY_VIP,
        stealVip: process.env.CUSTOM_REWARD_STEAL_VIP,
        revokeVip: process.env.CUSTOM_REWARD_REVOKE_VIP,
        immune: process.env.CUSTOM_REWARD_IMMUNE,
        timeout: process.env.CUSTOM_REWARD_TIMEOUT,
        buyMod: process.env.CUSTOM_REWARD_BUY_MOD
    }
}
