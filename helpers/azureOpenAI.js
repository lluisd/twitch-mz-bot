const config = require('../config')
const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity')
const { AzureOpenAI } = require('openai')

const credential = new DefaultAzureCredential()
const scope = "https://cognitiveservices.azure.com/.default"
const azureADTokenProvider = getBearerTokenProvider(credential, scope)

const deployment = "chat";
const apiVersion = "2023-03-15-preview";

class AzureOpenAIApi {
    client = null

    constructor() {
        this.client = new AzureOpenAI({ azureADTokenProvider, deployment, apiVersion })
    }

    async chat(message) {
        const result = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ "role": "user", "content": message}],
            max_tokens: 30})
        return result.choices[0]
    }
}

const api = new AzureOpenAIApi()
module.exports = api
