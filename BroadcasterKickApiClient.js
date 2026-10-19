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
            if (!tokenData || !tokenData.refreshToken) {
                throw new Error('Kick broadcaster refresh token is missing; authorize the broadcaster before starting')
            }

            authProvider.onRefresh(async (newTokenData) => {
                const result = await TokenService.updateToken(config.kick.user_id, newTokenData)
                if (!result.acknowledged || result.matchedCount !== 1) {
                    throw new Error('Kick broadcaster token could not be saved')
                }
            })

            await authProvider.addUserForToken(tokenData)

            this.apiClient = new KickApiClient({
                authProvider
            })
        }

        return this.apiClient
    }

    async refreshAccessToken() {
        const apiClient = await this.getApiClient()
        await apiClient.authProvider.getAccessToken({ forceRefresh: true })
    }

    async postChatMessage(message) {
        try {
            const apiClient = await this.getApiClient()
            const body = {
                broadcaster_user_id: parseInt(config.kick.user_id),
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
