const config = require('./config')
const {AzureOpenAI} = require("openai");

class OpenAIApiClient {
    constructor() {
        this.apiClient = null
        this.embeddingClient = null
    }

    getApiClient () {
        if (this.apiClient === null) {
            this.apiClient = new AzureOpenAI({
                endpoint: config.openAI.endpoint_base,
                apiVersion: config.openAI.apiVersion,
                apiKey: config.openAI.key,
                deployment: config.openAI.deployment
            })
        }
        return this.apiClient
    }

    getEmbeddingClient () {
        if (this.embeddingClient === null) {
            this.embeddingClient = new AzureOpenAI({
                endpoint: config.openAI.endpoint_base,
                apiKey: config.openAI.key,
                apiVersion: config.openAI.embedding.apiVersion,
                deployment: config.openAI.embedding.deployment
            })
        }
        return this.embeddingClient
    }
}

module.exports = new OpenAIApiClient()
