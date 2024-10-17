const config = require('./config')
const {RefreshingAuthProvider} = require("@twurple/auth");
const TokenService = require("./services/token");
const {ApiClient} = require("@twurple/api");

class BroadcasterApiClient {
    constructor() {
        this.apiClient = null
    }

    async getApiClient () {
        if (this.apiClient === null) {
            const authProvider = new RefreshingAuthProvider(
                {
                    clientId: config.twitch.clientId,
                    clientSecret: config.twitch.clientSecret
                }
            )
            const tokenData = await TokenService.getToken(config.twitch.roomId)

            authProvider.onRefresh(async (userId, newTokenData) => {
                await TokenService.updateToken(userId, newTokenData)
            })

            await authProvider.addUserForToken(tokenData);

            this.apiClient = new ApiClient({authProvider})
        }
        return this.apiClient
    }
}

module.exports = new BroadcasterApiClient()
