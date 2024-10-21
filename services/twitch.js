const config = require('../config')
const dbManager = require('../helpers/dbmanager')
const broadcasterApiClient = require('../broadcasterApiClient')
const moment = require('moment')

const endpointPrefix = 'https://api.twitch.tv/helix'

async function setTitle(title) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.channels.updateChannelInfo(config.twitch.roomId, { title: title })
}

async function setGame(name) {
    const api = await broadcasterApiClient.getApiClient()
    const game = await api.games.getGameByName(name)
    if (game) {
        return await api.channels.updateChannelInfo(config.twitch.roomId, { gameId: game.id })
    }
}

async function getCurrentUsers() {
    const api = await broadcasterApiClient.getApiClient()
    const users = await api.chat.getChattersPaginated(config.twitch.roomId)
    let usersList = []
    for await (const user of users) {
        usersList.push(user)
    }
    return usersList
}

async function updateBannedUsers () {
    const api = await broadcasterApiClient.getApiClient()
    const bans = await api.moderation.getBannedUsersPaginated(config.twitch.roomId)
    let bansList = []
    for await (const ban of bans) {
        const line = {roomId: config.twitch.roomId, userName: ban.userName, moderatorName: ban.moderatorName,
            reason: ban.reason, creationDate: ban.creationDate, expiryDate: ban.expiryDate}

        bansList.push(line)
    }
    if (bansList.length > 0) {
        await dbManager.clearBans(config.twitch.roomId)
        await dbManager.addBans(bansList)
    }
    return bansList
}

async function getBannedUsersCountByDate (date) {
    const bans = await dbManager.getPermanentBans(config.twitch.roomId)
    return bans.filter(ban => ban.creationDate > date)
}

async function getTimeouts () {
    return dbManager.getTimeouts(config.twitch.roomId)
}

async function addBan (roomId, userName, moderatorName, reason, creationDate, expiryDate) {
    await dbManager.addBan(roomId, userName, moderatorName, reason, creationDate, expiryDate);
}

async function removeBan (roomId, userName) {
    await dbManager.removeBan(roomId, userName);
}

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
        result = { ...liveData, lastTitle: channel.title}
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
        result = data?.data !== null ?? null

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
        result = data?.status === 204 ?? null

    } catch (e) {
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

async function sendAnnouncement(text, color) {
    const options = await _getHeaders()
    options.method = 'POST'
    const channel = await dbManager.getChannel(config.twitch.channels).lean()
    const endpoint = `${endpointPrefix}/chat/announcements?broadcaster_id=${channel.roomId}&moderator_id=${config.twitch.userId}`

    const body = {
        message: text,
        color: color
    }

    options.body = JSON.stringify(body)

    try {
        await fetch(endpoint, options)
    } catch (e) {
        console.log('error sending announcement: ' + e)
    }
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
            'Authorization': 'Bearer ' + token.accessToken,
            'Content-Type': 'application/json'
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
    getUser,
    sendAnnouncement,
    setTitle,
    setGame,
    updateBannedUsers,
    addBan,
    getBannedUsersCountByDate,
    getTimeouts,
    removeBan,
    getCurrentUsers
}


