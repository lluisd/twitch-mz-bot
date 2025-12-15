module.exports = {
    externalUrl: process.env.EXTERNAL_URL,
    database: {
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_NAME
    },
    twitch: {
        enabled: process.env.TWITCH_ENABLED === 'true',
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
        useQdrant: true,
    },
    openAI: {
        endpoint_base: process.env.AZURE_OPENAI_ENDPOINT_BASE,
        key: process.env.AZURE_OPENAI_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION,
        vectorStoreId: process.env.AZURE_OPENAI_VECTOR_STORE_ID,
        assistantId: process.env.AZURE_OPENAI_ASSISTANT_ID,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        model: process.env.AZURE_OPENAI_MODEL,
        embedding: {
            model: process.env.AZURE_OPENAI_EMBEDDING_MODEL,
            deployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            apiVersion: process.env.AZURE_OPENAI_EMBEDDING_API_VERSION,
        }
    },
    qdrant: {
        url: process.env.QDRANT_URL,
        collection: process.env.QDRANT_COLLECTION,
        embeddingSize: process.env.QDRANT_EMBEDDING_SIZE
    },
    whisper: {
        endpoint: process.env.WHISPER_ENDPOINT,
        platform: process.env.WHISPER_PLATFORM
    },
    blobStorage: {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME
    },
    ha: {
        apiKey: process.env.HA_API_KEY,
        endpoint: process.env.HA_ENDPOINT,
        entityId: process.env.HA_ENTITY_ID
    },
    loki: {
        enabled: process.env.LOKI_ENABLED === 'true',
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
        immuneSlot1: process.env.CUSTOM_REWARD_IMMUNE_SLOT_1,
        immuneSlot2: process.env.CUSTOM_REWARD_IMMUNE_SLOT_2,
        immuneSlot3: process.env.CUSTOM_REWARD_IMMUNE_SLOT_3,
        immuneSlot4: process.env.CUSTOM_REWARD_IMMUNE_SLOT_4,
        immuneSlot5: process.env.CUSTOM_REWARD_IMMUNE_SLOT_5,
        timeout: process.env.CUSTOM_REWARD_TIMEOUT,
        setTitle: process.env.CUSTOM_REWARD_TITLE,
        unban: process.env.CUSTOM_REWARD_UNBAN,
    }
}
