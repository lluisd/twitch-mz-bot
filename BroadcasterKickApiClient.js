const config = require("./config")
const KickRefreshingAuthProvider = require("./api/auth/kickRefreshingAuthProvider")
const KickApiClient = require("./api/kickApi")
const TokenService = require("./services/token")
const logger = require('./lib/logger')

class BroadcasterKickApiClient {
    constructor() {
        this.apiClient = null
    }

    async getApiClient() {
        if (this.apiClient === null) {
            const authProvider = new KickRefreshingAuthProvider({
                clientId: config.kick.clientId,
                clientSecret: config.kick.clientSecret
            })

            const tokenData = await TokenService.getToken(config.kick.user_id)

            authProvider.onRefresh(async (newTokenData) => {
                await TokenService.updateToken(config.kick.user_id, newTokenData)
            })

            await authProvider.addUserForToken(tokenData)

            this.apiClient = new KickApiClient({
                authProvider
            })
        }

        return this.apiClient
    }

    async postChatMessage(message) {
        try {
            const apiClient = await this.getApiClient()
            const body = {
                broadcaster_user_id: config.kick.user_id, // o channel_id si es así
                content: message,
                type: "bot"
            };
            await apiClient.request('POST', `chat`, body)
        } catch (error) {
            logger.error('[BroadcasterKickApiClient] Error enviando mensaje de chat:', error)
            return null
        }
    }
}

module.exports = new BroadcasterKickApiClient()
