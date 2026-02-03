const config = require('../config/index');
const moment = require("moment");
const Instructor = require("@instructor-ai/instructor").default
const { z } = require("zod")
const { QdrantClient } = require("@qdrant/qdrant-js");
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
    // función recursiva interna
    function searchConditions(conditions = []) {
        for (const condition of conditions) {

            // Caso 1: FieldCondition
            if (condition.key === targetKey) {
                return condition;
            }

            // Caso 2: NestedCondition
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

    // Buscar en must, should, y must_not
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

const options = {
    keys: ['nick'],
    includeScore: true,    // devuelve la puntuación de similitud
    threshold: 0.4,        // 0 = coincidencia exacta, 1 = muy flexible
    ignoreLocation: true   // ignorar la posición de la coincidencia
};


async function test() {

}

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


async function ask(query, username) {
    let result
    const excludedIndexes = new Set(['type']);

    try {
        const indexes = {type: { data_type: 'keyword' }, date: {data_type:"datetime"}, nick: {data_type:"keyword"} };
        const formattedIndexes = Object.entries(indexes)
            .filter(([indexName]) => !excludedIndexes.has(indexName))
            .map(([indexName, index]) => `- ${indexName} - ${index.data_type}`)
            .join("\n");

        const content = `<query>${query}</query><indexes>\n${formattedIndexes}`
        const SYSTEM_PROMPT = `
            Estás extrayendo filtros de una consulta de texto. Por favor, sigue las siguientes reglas:
            1. La consulta se proporciona en forma de texto encerrado entre etiquetas <query>.
            2. Los índices disponibles se encuentran al final del texto en forma de una lista encerrada entre etiquetas <indexes>.
            3. No puedes usar ningún campo que no esté disponible en los índices.
            4. Genera un filtro solo si estás seguro de que la intención del usuario coincide con el nombre del campo, a exepción de "type" que tendra el valor "chat" cuando se pregunto algo sobre los usuarios del chat o "stream" cuando haga referencia al streamer.
            5. Intenta adivinar si preguntan por algun usuario para usarlo en el filtro de "nick".
            6. Los filtros con fecha como "date" deben estar en formato ISO 8601 con zona horaria UTC.
            7. Ahora mismo es ${moment().tz('Europe/Madrid').format('MMMM Do YYYY, h:mm:ss a')}.
`;


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

        const filterNick = findFilterByKey(filters, 'nick')
        if (filterNick) {
            const nicks =  await dbManager.getAllNicks(config.twitch.roomId)
            const nicksObjects = nicks.map(nick => ({ nick }));
            const fuse = new Fuse(nicksObjects, options);
            const possibleNicks = fuse.search(filterNick.match.value);
            if (possibleNicks.length > 0) {
                query = query.replace(filterNick.match.value, possibleNicks[0].item.nick)
                filterNick.match.value = possibleNicks[0].item.nick;  // mejor match
                logger.info(`nick fuse: ${filterNick.match.value }`)
            }
        }

        const systemPrompt =  `Eres el asistente del canal de twitch llamado ${config.twitch.channels}, conoces todas las transcripciones del stream por él mismo y todos los mensajes de su chat.`;

        const embedQuery = await embeddingClient.embeddings.create({
            input: [query],
            model: config.openAI.model,
        })

        const cleanFilter = cleanQdrantFilter(filters);
        const results = await qdrantClient.search(config.qdrant.collection, {
            vector: embedQuery.data[0].embedding,
            limit: 5,
            //score_threshold: 0.75,
            filter: cleanFilter
        })

        logger.info(`results encontrados en Qdrant: ${results.length} ${JSON.stringify(results)}`)

        const context = results
            .map((r) => {
                if (r.payload.type === 'stream') {
                    return `El streamer dijo: "${r.payload.text}"`
                }

                return `Un usuario dijo: "${r.payload.text}"`
            })
            .join("\n")

        const completion = await chatClient.chat.completions.create({
            model: config.openAI.model,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: `Responde en no más de 200 caracteres la pregunta: ${query}\n\nContexto relevante del RAG:\n${context}`,
                },
            ],
        });

        result = completion.choices[0].message.content;
        result = cleanAssistantText(result)

        logger.info(`respeusta final openAIResponsesApi: ${result}`)

    } catch (e) {
        logger.error("Error test openAIResponsesApi:", e.message)
    }
    return result
}

function cleanAssistantText(text) {
    return text.replaceAll(/【.*?】/g, "")
}

module.exports = {
    ask,
    test
}
