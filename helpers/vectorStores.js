const config = require("../config")
const openAIApiClient = require('../openAIApiClient')
const moment = require("moment")
require('moment/locale/es')
const { BlobServiceClient } = require('@azure/storage-blob');

moment.locale('es')
const assistantsClient = openAIApiClient.getApiClient()

async function fetchRecordsFromVectorStore(prefix) {
    const grouped = {}
    const fileIds = []

    const currentYM = moment().format("YYYY-MM")
    for await (const vsFile of assistantsClient.vectorStores.files.list(config.openAI.vectorStoreId)) {
        try {
            const file = await assistantsClient.files.retrieve(vsFile.id)

            const match = file.filename.match(new RegExp(`^${prefix}_(\\d{4}-\\d{2})-\\d{2}\\.json$`));
            if (match) {
                const ym = match[1]

                if (ym === currentYM) {
                    continue
                }

                const jsonContent = await readJsonBlob(file.filename)

                if (!grouped[ym]) grouped[ym] = []
                grouped[ym].push(jsonContent)
                fileIds.push(file.id)
            }
        } catch (err) {
            await assistantsClient.vectorStores.files.del(config.openAI.vectorStoreId, vsFile.id)
        }
    }

    return {
        grouped: grouped,
        fileIds: fileIds
    };
}

async function readJsonBlob(blobName) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.blobStorage.connectionString)
    const containerClient = blobServiceClient.getContainerClient(config.blobStorage.containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const buffer  = await blockBlobClient.downloadToBuffer()
    return JSON.parse(buffer.toString("utf-8"))
}

async function deleteRecordsFromVectorStore(fileId) {
    await assistantsClient.vectorStores.files.del(config.openAI.vectorStoreId, fileId)
    await assistantsClient.files.del(fileId)
}

module.exports = {
    fetchRecordsFromVectorStore,
    deleteRecordsFromVectorStore
};