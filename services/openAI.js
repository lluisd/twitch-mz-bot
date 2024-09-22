const openAI = require('../helpers/azureOpenAI')

async function askOpenAI(message) {
    return await openAI.chat(message)
}

module.exports = {
    askOpenAI
}
