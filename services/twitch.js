const config = require('../config')
const dbManager = require('../helpers/dbmanager')

const endpointPrefix = 'https://api.twitch.tv/helix/streams'

async function getStream() {
    let result = null

    const token = await dbManager.getToken(parseInt(config.twitch.userId)).lean()
    const endpoint = endpointPrefix + '?user_login=' + config.twitch.channels
    const options = {
        headers: {
            'Client-Id': config.twitch.clientId,
            'Authorization': 'Bearer ' + token.accessToken
        }
    }
    const response = await fetch(endpoint, options)
    const data = await response.json()
    const liveData = data?.data?.[0] ?? null

    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    if (liveData && !channel.live) {
        await dbManager.updateChannel(config.twitch.channels, true)
        result = liveData
    } else if (!liveData && channel.live) {
        await dbManager.updateChannel(config.twitch.channels, false)
    }

    return result
}

module.exports = {
    getStream
}
