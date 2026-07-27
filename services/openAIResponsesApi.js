const config = require('../config/index');
const moment = require("moment");

require('moment/locale/es')
moment.locale('es')
const logger = require('../lib/logger')
const openAIApiClient = require('../openAIApiClient')
const qdrantApiClient = require("../qdrantApiClient");
const dbManager = require("../helpers/dbmanager");
const Fuse = require('fuse.js');
const { buildSparseVector } = require('../helpers/sparseVector')

const qdrantClient = qdrantApiClient.getApiClient()
const embeddingClient = openAIApiClient.getEmbeddingClient()
const chatClient = openAIApiClient.getApiClient()

// Per-user conversation history (keyed by username)
const historyByUser = {}
const MAX_HISTORY = 10
const QUERY_INTENT_JSON_SCHEMA = {
    type: "object",
    properties: {
        type: { type: ["string", "null"], enum: ["chat", "stream", null] },
        nick: { type: ["string", "null"] },
        date_from: { type: ["string", "null"] },
        date_to: { type: ["string", "null"] }
    },
    required: ["type", "nick", "date_from", "date_to"],
    additionalProperties: false
}

function getUserHistory(username) {
    if (!historyByUser[username]) {
        historyByUser[username] = []
    }
    return historyByUser[username]
}

async function ask(query, username) {
    const userHistory = getUserHistory(username)
    userHistory.push({ role: "user", content: query })

    // Keep only last MAX_HISTORY messages
    if (userHistory.length > MAX_HISTORY) {
        historyByUser[username] = userHistory.slice(-MAX_HISTORY)
    }

    const recentHistory = historyByUser[username].slice(-MAX_HISTORY)

    let result
    const propertiesToShow = ['type', 'date', 'nick']

    try {
        const indexes = { type: { data_type: 'keyword' }, date: { data_type: "datetime" }, nick: { data_type: "keyword" } }
        const formattedIndexes = Object.entries(indexes)
            .filter(([key]) => propertiesToShow.includes(key))
            .map(([indexName, index]) => `- ${indexName} - ${index.data_type}`)
            .join("\n");

        const content = `<query>${query}</query><indexes>\n${formattedIndexes}</indexes>`
        const SYSTEM_PROMPT = `
            Estás extrayendo la intención de búsqueda de una consulta de texto. Sigue estas reglas:
            1. La consulta está encerrada entre etiquetas <query>. Los índices disponibles están al final entre <indexes>.
            2. "type" es "stream" cuando la pregunta trata sobre el streamer: cosas que dijo, hizo, piensa, o datos/atributos suyos (su mascota, su edad, sus gustos, etc). Es "chat" cuando trata sobre usuarios del chat. Usa null si no aplica. Ejemplos:
               - "¿cómo se llama el perro del streamer?" -> type=stream
               - "¿qué dijo Fulanito ayer en el chat?" -> type=chat, nick=Fulanito
               - "resumen de lo que pasó el 3 de marzo" -> type=null
            3. "nick" es el usuario del chat al que se refiere la pregunta (adivina si hace falta). Usa null si no aplica.
            4. "date_from"/"date_to" en formato ISO 8601 con zona horaria UTC. Usa null si no aplica.
            5. Ahora mismo es ${moment().tz('Europe/Madrid').format('MMMM Do YYYY, h:mm:ss a')}.
            6. Si no estás seguro de un campo, usa null en vez de adivinar.
`
        const analysisResponse = await chatClient.responses.create({
            model: config.openAI.model,
            input: [
                { role: "system", content: SYSTEM_PROMPT.trim() },
                { role: "user", content: content }
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "query_intent",
                    strict: true,
                    schema: QUERY_INTENT_JSON_SCHEMA
                }
            }
        })

        const intent = JSON.parse(analysisResponse.output_text)
        logger.info(`Intención de búsqueda detectada: ${JSON.stringify(intent)}`)

        if (intent.type === 'chat' && intent.nick) {
            const nicksWithCount = await dbManager.getAllNicks(config.twitch.roomId)
            const nicksObjects = nicksWithCount.map(n => ({
                nick: n._id.toLowerCase(),
                count: n.count
            }))
            const nickQuery = intent.nick.toLowerCase()

            const exactMatch = nicksObjects.find(n => n.nick === nickQuery)
            if (exactMatch) {
                intent.nick = exactMatch.nick
            } else {
                const fuse = new Fuse(nicksObjects, { keys: ['nick'], threshold: 0.2, distance: 100, ignoreLocation: true });
                const possibleNicks = fuse.search(nickQuery)
                if (possibleNicks.length > 0) {
                    const bestMatch = possibleNicks
                        .map(r => ({ ...r.item, fuseScore: r.score }))
                        .sort((a, b) => (a.fuseScore - b.fuseScore) || (b.count - a.count))[0]

                    intent.nick = bestMatch.nick
                } else {
                    intent.nick = null
                }
            }
            logger.info(`nick resuelto: ${intent.nick}`)
        } else if (intent.type === 'stream') {
            // Las transcripciones del stream no llevan nick de chat asociado.
            intent.nick = null
        }

        const systemPrompt = `Eres un bot del chat de Twitch del canal ${config.twitch.channels}. Hablas de forma casual e informal como si fueras un espectador más del chat. Usas un tono desenfadado, directo y con humor cuando sea apropiado. El usuario que pregunta es ${username}.`;

        const embedQuery = await embeddingClient.embeddings.create({
            input: [query],
            model: config.openAI.embedding.model,
        })

        const qdrantFilter = buildQdrantFilter(intent)
        const sparseQuery = buildSparseVector(query)
        const prefetchLimit = config.qdrant.limit * 3

        const { points: results } = await qdrantClient.query(config.qdrant.collection, {
            prefetch: [
                { query: embedQuery.data[0].embedding, using: "text-dense", limit: prefetchLimit, filter: qdrantFilter },
                { query: sparseQuery, using: "text-sparse", limit: prefetchLimit, filter: qdrantFilter }
            ],
            query: { fusion: "rrf" },
            limit: config.qdrant.limit,
            filter: qdrantFilter,
            with_payload: true
        })

        logger.info(`results encontrados en Qdrant: ${results.length} ${JSON.stringify(results)}`)

        const context = results
            .map((r) => {
                const date = r.payload.date ? moment(r.payload.date).tz('Europe/Madrid').format('DD/MM/YYYY HH:mm') : 'fecha desconocida'
                if (r.payload.type === 'stream') {
                    return `[${date}] El streamer dijo: "${r.payload.text}"`
                }
                const nick = r.payload.nick ? `${r.payload.nick}` : 'Usuario desconocido'
                return `[${date}] ${nick} dijo: "${r.payload.text}"`
            })
            .join("\n")

        const response = await chatClient.responses.create({
            model: config.openAI.model,
            input: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "system",
                    content: `Memoria recuperada:\n${context || "No hay memoria relevante para esta consulta."}`
                },
                ...recentHistory,
            ],
            instructions: `Eres un bot del chat de Twitch del canal ${config.twitch.channels}.

Habla SIEMPRE en español, con un tono casual, natural y breve, como si fueras un espectador habitual del chat. No seas excesivamente educado ni uses lenguaje de asistente.

Si se proporciona memoria relevante, intégrala de forma natural en la respuesta. Nunca menciones que proviene de una memoria, contexto o base de datos.

Si la memoria no contiene la respuesta o no es relevante, dilo con naturalidad ("ni idea", "no me suena", "no tengo ese dato", etc.). No inventes información.

Responde únicamente al último mensaje del chat, salvo que el contexto indique claramente lo contrario.

Máximo 400 caracteres. No uses listas, explicaciones largas ni emojis salvo que encajen de forma natural.`
        });

        result = response.output_text;
        result = cleanAssistantText(result)
        historyByUser[username].push({ role: "assistant", content: result })
        logger.info(`respuesta final openAIResponsesApi: ${result}`)

    } catch (e) {
        logger.error(`Error en openAIResponsesApi para ${username}: ${e.message}`)
        logger.error(e.stack)
        result = 'Lo siento, ha ocurrido un error al procesar tu pregunta.'
    }
    return result
}

function cleanAssistantText(text) {
    return text.replaceAll(/【.*?】/g, "")
}

function buildQdrantFilter(intent) {
    const must = []

    if (intent.type) {
        must.push({ key: 'type', match: { value: intent.type } })
    }
    if (intent.nick) {
        must.push({ key: 'nick', match: { value: intent.nick } })
    }
    if (intent.date_from || intent.date_to) {
        const range = {}
        if (intent.date_from) range.gte = intent.date_from
        if (intent.date_to) range.lte = intent.date_to
        must.push({ key: 'date', range })
    }

    return must.length > 0 ? { must } : undefined
}

module.exports = {
    ask
}
