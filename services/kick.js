const logger = require('../lib/logger')
const config = require("../config");
const { getKickToken, invalidateKickToken } = require('./kickToken')
const broadcasterKickApiClient = require('../BroadcasterKickApiClient')


const endpointPrefix = 'https://api.kick.com/public/v1/'

async function getLiveStream() {
    try {
        let options = await _getHeaders()
        options.method = 'GET'
        const url = new URL(endpointPrefix + 'users/livestreams')
        url.searchParams.append('user_id', config.kick.user_id)

        logger.log(`[Kick] Fetching live stream for user_id ${config.kick.user_id}... with url: ${url.toString()}`)

        const response = await fetch(url, options)

        if (response.status === 401) {
            invalidateKickToken()
            throw new Error('Kick token inválido')
        }

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Kick API error ${response.status}: ${text}`)
        }

        logger.log(`[Kick] Live stream fetched successfully for user_id ${config.kick.user_id} with response: ${await response.clone().text()}`)
        return await response.json()

    } catch (err) {
        logger.error('[Kick] Error en getLiveStream:', err)
        return null
    }
}

async function chat(message) {
    try {
        await broadcasterKickApiClient.postChatMessage(message)
    } catch (err) {
        logger.error('[Kick] Error on send chat:', err)
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
    getLiveStream,
    chat
}
