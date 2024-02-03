const config = require('../config')
const dbManager = require('../helpers/dbmanager')

const endpointPrefix = 'https://api.twitch.tv/helix/streams'

async function getStream() {
    let result = { type: 'notLive'}

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
        await dbManager.updateChannel(config.twitch.channels, { live: true })
        result = liveData
    } else if (!liveData && channel.live) {
        await dbManager.updateChannel(config.twitch.channels, { live: false })
        result = { type: 'finished', messageId: channel.lastMessageId}
    } else if (liveData && channel.live) {
        result = { ...liveData, type: 'stillLive', messageId: channel.lastMessageId, lastTitle: channel.title}
    }

    return result
}

async function saveLastMessage (msg) {
    await dbManager.updateChannel(config.twitch.channels, { lastMessageId: msg.message_id })
}

async function deleteLastMessage () {
    await dbManager.updateChannel(config.twitch.channels, { lastMessageId: null })
}

async function saveTitle (title) {
    await dbManager.updateChannel(config.twitch.channels, { title: title })
}


module.exports = {
    getStream,
    saveLastMessage,
    deleteLastMessage,
    saveTitle
}
