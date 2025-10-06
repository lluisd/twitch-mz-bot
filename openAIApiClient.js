const config = require('./config')
const {AzureOpenAI} = require("openai");

class OpenAIApiClient {
    constructor() {
        this.apiClient = null
    }

    getApiClient () {
        if (this.apiClient === null) {
            this.apiClient = new AzureOpenAI({
                endpoint: config.openAI.endpoint_base,
                apiVersion: config.openAI.apiVersion,
                apiKey: config.openAI.key
            })
        }
        return this.apiClient
    }
}

module.exports = new OpenAIApiClient()
