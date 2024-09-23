const config = require('../config')

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
    askOpenAI
}
