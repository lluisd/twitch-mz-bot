const config = require('../config')
const dbManager = require('../helpers/dbmanager')

const endpointPrefix = 'https://api.twitch.tv/helix/streams'

async function getStream() {
    let result = { type: 'notLive'}
    let liveData = null

    const token = await dbManager.getToken(parseInt(config.twitch.userId)).lean()
    const endpoint = endpointPrefix + '?user_login=' + config.twitch.channels
    const options = {
        headers: {
            'Client-Id': config.twitch.clientId,
            'Authorization': 'Bearer ' + token.accessToken
        }
    }

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        liveData = data?.data?.[0] ?? null

    } catch {
        result = { type: 'error'}
    }

    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    if (liveData && !channel.live) {
        await dbManager.updateChannel(config.twitch.channels, { live: true, streamId: liveData.id, title: liveData.title })
        result = liveData
    } else if (!liveData && channel.live) {
        await dbManager.updateChannel(config.twitch.channels, { live: false, streamId: null, lastMessageId: null })
        result = { type: 'finished', messageId: channel.lastMessageId, streamId: channel.streamId}
    } else if (liveData && channel.live) {
        await dbManager.updateChannel(config.twitch.channels, { streamId: liveData.id, title: liveData.title })
        result = { ...liveData, type: 'stillLive', messageId: channel.lastMessageId, lastTitle: channel.title}
    }

    return { ...result, lastUpdate: channel.lastUpdate}
}

async function getChannel () {
    return dbManager.getChannel(config.twitch.channels).lean()
}

async function saveLastMessage (msg) {
    await dbManager.updateChannel(config.twitch.channels, { lastMessageId: msg.message_id })
}


module.exports = {
    getStream,
    saveLastMessage,
    getChannel
}
