const config = require('../config')
const dbManager = require('../helpers/dbmanager')

const endpointPrefix = 'https://api.twitch.tv/helix'

async function getStream() {
    let result = { type: 'notLive'}
    let liveData = null

    const options = await _getHeaders()
    const endpoint = endpointPrefix + '/streams?user_login=' + config.twitch.channels

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        liveData = data?.data?.[0] ?? null

    } catch {
        result = { type: 'error'}
    }

    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    if (liveData && !channel.live) {
        await dbManager.updateChannel(config.twitch.channels, { live: true, streamId: liveData.id, title: liveData.title, lastUpdate: new Date() })
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

async function getUnbanRequests () {
    let result
    let options = await _getHeaders()
    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    const endpoint = `${endpointPrefix}/moderation/unban_requests?broadcaster_id=${channel.roomId}&moderator_id=${config.twitch.userId}&status=pending`

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        result = data?.data ?? null

    } catch {
        result = null
    }

    return result
}

async function banUser (user, duration) {
    let result
    let options = await _getHeaders()
    options.method = 'POST'
    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    const endpoint = `${endpointPrefix}/moderation/bans?broadcaster_id=${channel.roomId}&moderator_id=${config.twitch.userId}`

    const body = {
        data : {
            user_id: user,
            ...duration && {duration:  duration},
            reason: 'Bot'
        }
    }

    options.body = JSON.stringify(body)
    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        result = data?.data ?? null

    } catch {
        result = null
    }

    return result
}

async function unBanUser (user) {
    let result
    let options = await _getHeaders()
    options.method = 'DELETE'
    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    const endpoint = `${endpointPrefix}/moderation/bans?broadcaster_id=${channel.roomId}&moderator_id=${config.twitch.userId}&user_id=${user}`

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        result = data?.data ?? null

    } catch {
        result = null
    }

    return result
}

async function getUser (userName) {
    let result
    let options = await _getHeaders()
    options.method = 'GET'
    const endpoint = `${endpointPrefix}/users?login=${userName}`

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        result = data?.data?.[0] ?? null

    } catch {
        result = null
    }

    return result

}


async function getChannel () {
    return dbManager.getChannel(config.twitch.channels).lean()
}

async function saveLastMessage (msg) {
    await dbManager.updateChannel(config.twitch.channels, { lastMessageId: msg.message_id })
}

async function saveLastUpdate () {
    await dbManager.updateChannel(config.twitch.channels, { lastUpdate: new Date() })
}

async function setActiveSpot (activeSpot) {
    return dbManager.updateChannel(config.twitch.channels, { activeSpot: activeSpot })
}

async function _getHeaders () {
    const token = await dbManager.getToken(parseInt(config.twitch.userId)).lean()
    return {
        headers: {
            'Client-Id': config.twitch.clientId,
            'Authorization': 'Bearer ' + token.accessToken
        }
    }
}

module.exports = {
    getStream,
    saveLastMessage,
    getChannel,
    saveLastUpdate,
    getUnbanRequests,
    setActiveSpot,
    banUser,
    unBanUser,
    getUser
}


