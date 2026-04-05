const config = require('../config/index');
const moment = require("moment");
const Instructor = require("@instructor-ai/instructor").default

require('moment/locale/es')
moment.locale('es')
const logger = require('../lib/logger')
const openAIApiClient = require('../openAIApiClient')
const qdrantApiClient = require("../qdrantApiClient");
const { FilterSchema } = require("./qdrant.filter.schema");
const dbManager = require("../helpers/dbmanager");
const Fuse = require('fuse.js');

const qdrantClient = qdrantApiClient.getApiClient()
const embeddingClient = openAIApiClient.getEmbeddingClient()
const chatClient = openAIApiClient.getApiClient()

function findFilterByKey(filter, targetKey) {
    function searchConditions(conditions = []) {
        for (const condition of conditions) {

            if (condition.key === targetKey) {
                return condition;
            }

            if (condition.nested) {
                const nestedResult = searchConditions(
                    condition.nested.filter.must ||
                    condition.nested.filter.should ||
                    condition.nested.filter.must_not
                );

                if (nestedResult) return nestedResult;
            }
        }

        return null;
    }

    return (
        searchConditions(filter.must) ||
        searchConditions(filter.should) ||
        searchConditions(filter.must_not) ||
        null
    );
}

const client = Instructor({
    client: chatClient,
    mode: "TOOLS"
})


function cleanQdrantFilter(filter) {
    const allowedKeys = ["must", "should", "must_not"];
    const cleaned = {};

    for (const key of allowedKeys) {
        if (filter[key]) {
            cleaned[key] = filter[key];
        }
    }

    return cleaned;
}

// Per-user conversation history (keyed by username)
const historyByUser = {}
const MAX_HISTORY = 10

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

        const content = `<query>${query}</query><indexes>\n${formattedIndexes}`
        const SYSTEM_PROMPT = `
            Estás extrayendo filtros de una consulta de texto. Por favor, sigue las siguientes reglas:
            1. La consulta se proporciona en forma de texto encerrado entre etiquetas <query>.
            2. Los índices disponibles se encuentran al final del texto en forma de una lista encerrada entre etiquetas <indexes>.
            3. No puedes usar ningún campo que no esté disponible en los índices.
            4. Genera un filtro solo si estás seguro de que la intención del usuario coincide con el nombre del campo, a excepción de "type" que tendrá el valor "chat" cuando se preguntó algo sobre los usuarios del chat o "stream" cuando haga referencia al streamer.
            5. Intenta adivinar si preguntan por algún usuario para usarlo en el filtro de "nick".
            6. Los filtros con fecha como "date" deben estar en formato ISO 8601 con zona horaria UTC.
            7. Ahora mismo es ${moment().tz('Europe/Madrid').format('MMMM Do YYYY, h:mm:ss a')}.
            8. Si no hay filtros claros, devuelve un objeto vacío.
`
        const filters = await client.chat.completions.create({
            model: config.openAI.model,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT.trim(),
                },
                {
                    role: "user",
                    content: content
                }
            ],
            response_model: {
                schema: FilterSchema,
                name: "Filter",
            }
        })
        logger.info(`Filtros detectados: ${JSON.stringify(filters)}`)

        const filterType = findFilterByKey(filters, 'type')
        const filterNick = findFilterByKey(filters, 'nick')

        if (filterType && filterType.match.value === 'chat' && filterNick) {
            const nicksWithCount = await dbManager.getAllNicks(config.twitch.roomId)
            const nicksObjects = nicksWithCount.map(n => ({
                nick: n._id.toLowerCase(),
                count: n.count
            }))
            const nickQuery = filterNick.match.value.toLowerCase()

            const exactMatch = nicksObjects.find(n => n.nick === nickQuery)
            if (exactMatch) {
                filterNick.match.value = exactMatch.nick
            } else {
                const fuse = new Fuse(nicksObjects, { keys: ['nick'], threshold: 0.2, distance: 100, ignoreLocation: true });
                const possibleNicks = fuse.search(nickQuery)
                if (possibleNicks.length > 0) {
                    const bestMatch = possibleNicks
                        .map(r => ({ ...r.item, fuseScore: r.score }))
                        .sort((a, b) => (a.fuseScore - b.fuseScore) || (b.count - a.count))[0]

                    filterNick.match.value = bestMatch.nick
                }
            }
            logger.info(`nick resuelto: ${filterNick.match.value}`)
        } else if (filterType && filterType.match.value === 'stream' && filterNick && filters.must) {
            filters.must = filters.must.filter(item => item.key !== "nick")
        }

        const systemPrompt = `Eres el asistente del canal de Twitch llamado ${config.twitch.channels}.
Conoces todas las transcripciones del stream realizadas por el propio streamer y todos los mensajes del chat.
El usuario que pregunta es: ${username}.
Usa únicamente la memoria recuperada para responder. Si no hay información relevante, dilo claramente.`;

        const embedQuery = await embeddingClient.embeddings.create({
            input: [query],
            model: config.openAI.embedding.model,
        })

        const cleanFilter = cleanQdrantFilter(filters);
        const results = await qdrantClient.search(config.qdrant.collection, {
            vector: embedQuery.data[0].embedding,
            limit: 8,
            score_threshold: 0.6,
            filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : undefined
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
            instructions: `Responde de forma clara y concisa en español.
No inventes información que no esté en la memoria recuperada.
Si no tienes información suficiente, dilo claramente.
Máximo 400 caracteres.`
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

module.exports = {
    ask
}
