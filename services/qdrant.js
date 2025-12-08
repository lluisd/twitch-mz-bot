const config = require('../config')
const moment = require("moment");
require('moment/locale/es')
moment.locale('es')
const logger = require('../lib/logger')
const qdrantApiClient = require('../qdrantApiClient')
const openAIApiClient = require('../openAIApiClient')
const crypto = require('crypto')

const qdrantClient = qdrantApiClient.getApiClient()
const embeddingClient = openAIApiClient.getEmbeddingClient()

async function uploadJsonToQdrant(json, formattedDate, origin) {
    try {
        const filename = `${origin}_${formattedDate}.json`
        const data = JSON.parse(json)
        const textsToEmbed = data.map(msg => `${msg.text}`)

        const batchSize = _pickBatchSize(data);
        // const firstBatch = textsToEmbed.slice(0, batchSize);
        // const firstEmbedding = await embeddingClient.embeddings.create({
        //     model: config.openAI.embedding.model,
        //     input: firstBatch
        // })

        await _processBatches(origin, data, batchSize, textsToEmbed)

        return { success: true, filename: filename }

    } catch (error) {
        return { success: false, error: error }
    }
}

async function _processBatches(origin, data, batchSize, textsToEmbed) {
   try{
       let totalProcessed = 0
       let vectorSize = null
       for (let i = 0; i < textsToEmbed.length; i += batchSize) {
           const batchData = data.slice(i, i + batchSize)
           const batchTextsToEmbed = textsToEmbed.slice(i, i + batchSize)

           logger.info(`Processing batch ${i / batchSize + 1} (${textsToEmbed.length})`)

           const embedding = await embeddingClient.embeddings.create({
               model: config.openAI.embedding.model,
               input: batchTextsToEmbed,
           });

           if (!vectorSize) vectorSize = embedding.data[0].embedding.length

           const points = embedding.data.map((item, j) => ({
               id: _generateDeterministicUuid(batchData[j].nick, batchData[j].text, batchData[j].date.replace(/\.\d+Z$/, "Z"), origin),
               vector: item.embedding,
               payload: {
                   nick: batchData[j].nick,
                   text: batchData[j].text,
                   date: batchData[j].date.replace(/\.\d+Z$/, "Z"),
                   type: origin
               }
           }));

           const pointsToInsert = await filterNonExistingPoints(points)
           if (pointsToInsert.length > 0) {
               await qdrantClient.upsert(config.qdrant.collection, {wait: true, points})
           }

           totalProcessed += points.length;
           logger.info(`→ Uploaded ${pointsToInsert.length} items to Qdrant of ${totalProcessed}/${textsToEmbed.length} process`)

           await new Promise(r => setTimeout(r, 200));
       }
       logger.info("✅ All items uploaded to Qdrant.")
   } catch (e) {
       logger.error("Error processing batches: " + e.message)
   }

}

async function exists(date, type) {
    try {
        await new Promise(r => setTimeout(r, 200))
        const start = moment.tz(date, 'YYYY-MM-DD', 'Europe/Madrid')
            .startOf('day')
            .utc()
            .toISOString()
        const end = moment.tz(date, 'YYYY-MM-DD', 'Europe/Madrid')
            .endOf('day')
            .utc()
            .toISOString()

        const { count } = await qdrantClient.count(config.qdrant.collection, {
            exact: true,
            filter: {
                must: [
                    {
                        key: "type",
                        match: {value: type}
                    },
                    {
                        key: "date",
                        range: {
                            gte: start,
                            lte: end
                        }
                    }
                ]
            }
        })

        return count > 0
    } catch (e) {
        logger.error(`Error in exists() for ${date} - ${type}: ${e.message}`)
    }
}





async function filterNonExistingPoints(points) {
    const ids = points.map(p => p.id)

    const existing = await qdrantClient.retrieve(config.qdrant.collection, {
        ids,
        with_vector: false,
        with_payload: false
    })

    const existingIds = new Set(existing.map(p => p.id))
    return points.filter(p => !existingIds.has(p.id));
}

async function createCollection() {
    try {
        const response = await qdrantClient.getCollections()
        const collectionNames = response.collections.map((collection) => collection.name)
        if (collectionNames.includes(config.qdrant.collection)) {
            await qdrantClient.deleteCollection(config.qdrant.collection);
        }

        await qdrantClient.createCollection(config.qdrant.collection, {
            vectors: {
                size: 1536,
                distance: "Cosine",
            },
            optimizers_config: {
                default_segment_number: 4,
            }
        });
        logger.info(`Collection ${config.qdrant.collection}, created.`);

        await qdrantClient.createPayloadIndex(config.qdrant.collection, {
            field_name: 'nick',
            field_schema: 'keyword',
            wait: true,
        });

        await qdrantClient.createPayloadIndex(config.qdrant.collection, {
            field_name: 'date',
            field_schema: 'datetime',
            wait: true,
        });

        await qdrantClient.createPayloadIndex(config.qdrant.collection, {
            field_name: 'type',
            field_schema: 'keyword',
            wait: true,
        });
    } catch (error) {
        logger.error(`Error creating collection ${config.qdrant.collection}, created.`);
    }
}

function _pickBatchSize(texts) {
    const avgLength = texts.reduce((sum, t) => sum + t.length, 0) / texts.length;
    if (avgLength < 100) return 200;
    if (avgLength < 500) return 100;
    if (avgLength < 2000) return 50;
    return 20;
}

function _generateDeterministicUuid(nick, text, date, type) {
    const combined = `${nick}|${text}|${date}|${type}`;
    const hash = crypto.createHash("sha256").update(combined, "utf8").digest("hex");

    return [
        hash.substring(0, 8),
        hash.substring(8, 12),
        hash.substring(12, 16),
        hash.substring(16, 20),
        hash.substring(20, 32),
    ].join("-");
}

module.exports = {
    uploadJsonToQdrant,
    createCollection,
    exists
}
