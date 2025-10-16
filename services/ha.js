const config = require('../config')

const endpointPrefix = `${config.ha.endpoint}/api/`

async function hibernateTranscriberPC() {
    let result = null
    const endpoint = endpointPrefix + 'services/button/press'

    const body = {
        "entity_id": config.ha.entityId
    }

    const options = {
        headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${config.ha.apiKey}`
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(endpoint, options)
        result = await response.json()
    } catch {
        result = null
    }

    return result
}

module.exports = {
    hibernateTranscriberPC
}
