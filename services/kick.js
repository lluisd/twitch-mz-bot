const logger = require('../lib/logger')
const config = require("../config");
const { getKickToken, invalidateKickToken } = require('./kickToken')

const endpointPrefix = 'https://api.kick.com/public/v1/'

async function getLiveStream() {
    try {
        let options = await _getHeaders()
        options.method = 'GET'
        const url = new URL(endpointPrefix + 'livestreams')
        url.searchParams.append('broadcaster_user_id', config.kick.user_id)

        const response = await fetch(url, options)

        if (response.status === 401) {
            invalidateKickToken()
            throw new Error('Kick token inválido')
        }

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Kick API error ${response.status}: ${text}`)
        }

        return await response.json()

    } catch (err) {
        logger.error('[Kick] Error en getLiveStream:', err)
        return null
    }
}

async function _getHeaders () {
    const token = await getKickToken()
    return {
        headers: {
            'Host': 'api.kick.com',
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*',
        }
    }
}

module.exports = {
    getLiveStream
}
