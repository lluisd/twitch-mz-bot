const config = require('./config')
const {RefreshingAuthProvider} = require("@twurple/auth")
const TokenService = require("./services/token")
const { ApiClient } = require("@twurple/api")
const { ChatClient } = require('@twurple/chat')

class BotClient {
    constructor() {
        this.authProvider = new RefreshingAuthProvider(
            {
                clientId: config.twitch.clientId,
                clientSecret: config.twitch.clientSecret
            }
        )
        this.apiClient = null
        this.chatClient = null

        this.ready = this._initToken()
    }
    async _initToken() {
        const tokenData = await TokenService.getToken(config.twitch.userId);
        this.authProvider.onRefresh(async (userId, newTokenData) => {
            await TokenService.updateToken(userId, newTokenData);
        });
        await this.authProvider.addUserForToken(tokenData);
    }

    async getChatClient () {
        if (this.chatClient === null) {
            this.chatClient = new ChatClient({
                authProvider: this.authProvider,
                channels: [ config.twitch.channels ],
                isAlwaysMod: true,
                logger: {
                    minLevel: 'info',
                    emoji: true,
                    colors: true
                },
                rejoinChannelsOnReconnect: true,
                ssl: true,
                webSocket: true
            })
        }
        return this.chatClient
    }

    async getApiClient () {
        if (this.apiClient === null) {
            this.apiClient = new ApiClient({
                authProvider: this.authProvider,
                logger: {
                    minLevel: 'info',
                    emoji: true,
                    colors: true
                }
            })
        }
        return this.apiClient
    }
}

module.exports = new BotClient()
