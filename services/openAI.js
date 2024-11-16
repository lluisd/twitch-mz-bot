const config = require('../config')
const { AzureOpenAI } = require('openai')
const moment = require('moment')
require('moment/locale/es')
moment.locale('es')

const getClient = () => {
    const assistantsClient = new AzureOpenAI({
        endpoint: config.openAI.endpoint_base,
        apiVersion: config.openAI.apiVersion,
        apiKey: config.openAI.key
    });
    return assistantsClient;
};

const assistantsClient = getClient();

const options = {
    model: "gpt-4o-mini", // replace with model deployment name
    name: config.twitch.username,
    instructions: "Eres un bot del canal de twitch del streamer llamado " + config.twitch.username + " que conoce todas las interacciones de los usuarios de su chat",
    tools: [{"type":"file_search"}],
    tool_resources: {"file_search":{"vector_store_ids":[config.openAI.vectorStoreId]}},
    temperature: 1,
    top_p: 1
};


async function askOpenAI(message) {
    let result
    let options = await _getHeaders()
    options.method = 'POST'
    const endpoint = config.openAI.endpoint

    const body = {
        model: 'gpt-4o-mini',
        messages: [{ "role": "user", "content": "resume en pocas palabras: " + message}],
        max_tokens: 70
    }

    options.body = JSON.stringify(body)

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        result = data?.choices[0]?.message?.content || null
    } catch {
        result = null
    }

    return result
}

let assistantThread = null


async function uploadFileToVectorStore(json, formattedDate, origin) {
    try {
        const filename = `${origin}_${formattedDate}.json`
        const buffer = Buffer.from(json, 'utf-8');
        const newFile = new File([buffer], filename, {
            type: 'application/json',
        });

        const files = [];
        for await (const file of assistantsClient.files.list()) {
            files.push({id: file.id, name: file.filename });
        }
        const matchedFiles = files.filter((file) => file.name === filename);
        for (const file of matchedFiles) {
            await assistantsClient.files.del(file.id);
        }

        await assistantsClient.beta.vectorStores.files.uploadAndPoll(config.openAI.vectorStoreId, newFile);
        return { success: true, filename: filename }

    } catch (error) {
        return { success: false }
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
                    nick: username,
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
            console.log(`Run status is ${runStatus}, unable to fetch messages.`);
        }
    } catch (error) {
        console.error(`Error running the assistant: ${error.message}`);
    }

    return result
}



function cleanAssistantText(text) {
    return text.replaceAll(/【.*?】/g, "")
}


async function _getHeaders () {
    return {
        headers: {
            'accept': 'application/json',
            'api-key': config.openAI.key,
            'Content-Type': 'application/json'
        }
    }
}

module.exports = {
    askOpenAI,
    askAssistant,
    uploadFileToVectorStore
}
