const config = require('./config')
const { QdrantClient } = require("@qdrant/qdrant-js")

class QdrantApiClient {
    constructor() {
        this.apiClient = null
    }

    getApiClient () {
        if (this.apiClient === null) {
            this.apiClient = new QdrantClient({
                url: config.qdrant.url,
                timeout: 200000,
            })
        }
        return this.apiClient
    }
}

module.exports = new QdrantApiClient()
