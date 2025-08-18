const config = require('../config')
const { AzureOpenAI } = require('openai');
const moment = require("moment");
const TranscriptionsService = require('../services/transcriptions')
require('moment/locale/es')
moment.locale('es')
const logger = require('../lib/logger')

const getClient = () => {
    return new AzureOpenAI({
        endpoint: config.openAI.endpoint_base,
        apiVersion: config.openAI.apiVersion,
        apiKey: config.openAI.key
    });
};

const assistantsClient = getClient();


async function uploadFileToVectorStore(json, formattedDate, origin) {
    try {
        const filename = `${origin}_${formattedDate}.json`
        const buffer = Buffer.from(json, 'utf-8');
        const newFile = new File([buffer], filename, {
            type: 'application/json',
        });

        await TranscriptionsService.uploadBlob(filename, json)

        const files = [];
        for await (const file of assistantsClient.files.list()) {
            files.push({id: file.id, name: file.filename });
        }
        const matchedFiles = files.filter((file) => file.name === filename);
        for (const file of matchedFiles) {
            await assistantsClient.files.delete(file.id);
        }

        await assistantsClient.vectorStores.files.uploadAndPoll(config.openAI.vectorStoreId, newFile);
        return { success: true, filename: filename }

    } catch (error) {
        return { success: false, error: error }
    }
}

async function askAssistant(message, username) {
    let result
    try {
        moment.locale('es')
        const response = await assistantsClient.responses.create({
            model: "gpt-5-mini",
            instructions: `Fecha actual: ${moment().tz('Europe/Madrid').format('MMMM Do YYYY, h:mm:ss a')}, el usuario se llama ${username}`,
            input: [
                {
                    role: "user",
                    content: "dime en 200 caracteres " + message,
                }
            ]
        })
        result = response.output[0].content[0].text
        result = cleanAssistantText(result)
    } catch (error) {
        logger.error(`Error running the assistant: ${error.message}`)
    }
    return result
}

function cleanAssistantText(text) {
    return text.replaceAll(/【.*?】/g, "")
}

module.exports = {
    askAssistant,
    uploadFileToVectorStore
}
