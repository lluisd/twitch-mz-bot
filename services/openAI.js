const config = require('../config')
const moment = require("moment");
const TranscriptionsService = require('../services/transcriptions')
require('moment/locale/es')
moment.locale('es')
const logger = require('../lib/logger')
const openAIApiClient = require('../openAIApiClient')

const assistantsClient = openAIApiClient.getApiClient()
let assistantThread = null

async function uploadFileToVectorStore(json, formattedDate, origin) {
    try {
        const filename = `${origin}_${formattedDate}.json`
        const buffer = Buffer.from(json, 'utf-8')
        const newFile = new File([buffer], filename, {
            type: 'application/json',
        })

        await TranscriptionsService.uploadBlob(filename, json)

        for await (const vsFile of assistantsClient.vectorStores.files.list(config.openAI.vectorStoreId)) {
            try {
                const file = await assistantsClient.files.retrieve(vsFile.id)
                if (file.filename === filename) {
                    await assistantsClient.vectorStores.files.del(config.openAI.vectorStoreId, vsFile.id)
                }
            } catch (err) {
                await assistantsClient.vectorStores.files.del(config.openAI.vectorStoreId, vsFile.id)
            }
        }

        for await (const file of assistantsClient.files.list()) {
            if (file.filename === filename) {
                await assistantsClient.files.del(file.id)
            }
        }

        await assistantsClient.vectorStores.files.uploadAndPoll(config.openAI.vectorStoreId, newFile)
        return { success: true, filename: filename }

    } catch (error) {
        return { success: false, error: error }
    }
}



async function askAssistant(message, username) {
    let result
    try {
        // Create a thread
        if (assistantThread === null) {
            assistantThread = await assistantsClient.beta.threads.create({});
        }

        // Add a user question to the thread
        const threadResponse = await assistantsClient.beta.threads.messages.create(
            assistantThread.id,
            {
                role: "user",
                content: "dime en 200 caracteres " + message,
                metadata: {
                    nick: username || config.twitch.username,
                }
            }
        );

        //const assistantResponse = await assistantsClient.beta.assistants.create(options);
        const assistantResponse = await assistantsClient.beta.assistants.retrieve(config.openAI.assistantId)
        // Run the thread and poll it until it is in a terminal state
        moment.locale('es')
        const runResponse = await assistantsClient.beta.threads.runs.create(
            assistantThread.id,
            {
                assistant_id: assistantResponse.id,
                additional_instructions: `Fecha actual: ${moment().tz('Europe/Madrid').format('MMMM Do YYYY, h:mm:ss a')}`
            }
        );

        // Polling until the run completes or fails
        let runStatus = runResponse.status;
        while (runStatus === 'queued' || runStatus === 'in_progress') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const runStatusResponse = await assistantsClient.beta.threads.runs.retrieve(
                assistantThread.id,
                runResponse.id
            );
            runStatus = runStatusResponse.status;
        }

        // Get the messages in the thread once the run has completed
        if (runStatus === 'completed') {
            const messagesResponse = await assistantsClient.beta.threads.messages.list(
                assistantThread.id
            );
            result = messagesResponse.data[0].content[0].text.value;
            result = cleanAssistantText(result)
        } else {
            logger.info(`Run status is ${runStatus}, unable to fetch messages.`);
        }
    } catch (error) {
        logger.error(`Error running the assistant: ${error.message}`);
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
