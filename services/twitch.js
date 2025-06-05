const config = require('../config')
const dbManager = require('../helpers/dbmanager')
const broadcasterApiClient = require('../broadcasterApiClient')
const moment = require('moment')
const logger = require('../lib/logger')

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

async function cancelRedemption(rewardId, redemptionId) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.channelPoints.updateRedemptionStatusByIds(config.twitch.roomId, rewardId, [redemptionId], 'CANCELED')
}

async function acceptRedemption(rewardId, redemptionId) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.channelPoints.updateRedemptionStatusByIds(config.twitch.roomId, rewardId, [redemptionId], 'FULFILLED')
}

async function getUserById(userId) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.users.getUserById(parseInt(userId()))
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
        const line = {roomId: config.twitch.roomId, userId: ban.userId, userName: ban.userName, moderatorName: ban.moderatorName,
            reason: ban.reason, creationDate: ban.creationDate, expiryDate: ban.expiryDate}

        bansList.push(line)
    }
    if (bansList.length > 0) {
        await dbManager.clearBans(config.twitch.roomId)
        await dbManager.addBans(bansList)
    }
    return bansList
}

async function updateVips () {
    const api = await broadcasterApiClient.getApiClient()
    const vips = await api.channels.getVipsPaginated(config.twitch.roomId)
    let vipsList = []
    for await (const vip of vips) {
        const line = {roomId: config.twitch.roomId, userId: vip.id, userName: vip.displayName}
        vipsList.push(line)
    }
    if (vipsList.length > 0) {
        await dbManager.clearVips(config.twitch.roomId)
        await dbManager.addVips(vipsList)
    }
    return vipsList
}

async function updateMods () {
    const api = await broadcasterApiClient.getApiClient()
    const mods = await api.moderation.getModeratorsPaginated(config.twitch.roomId)
    let modsList = []
    for await (const mod of mods) {
        const line = {roomId: config.twitch.roomId, userId: mod.userId, userName: mod.userDisplayName}
        modsList.push(line)
    }
    if (modsList.length > 0) {
        await dbManager.clearMods(config.twitch.roomId)
        await dbManager.addMods(modsList)
    }
    return modsList
}

async function isVip (userId) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.channels.checkVipForUser(config.twitch.roomId, userId)
}

async function isMod (userId) {
    const api = await broadcasterApiClient.getApiClient()
    return await api.moderation.checkUserMod(config.twitch.roomId, userId)
}

async function addVip (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.channels.addVip(config.twitch.roomId, userId);
    logger.info('User added as VIP: ' + userId)
}

async function addVipHandler (roomId, userId, userName) {
    await dbManager.addVip(roomId, userId, userName)
}

async function removeVip (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.channels.removeVip(config.twitch.roomId, userId);
    logger.info('User removed as VIP: ' + userId)
}

async function removeVipHandler (roomId, userId) {
    await dbManager.removeVip(roomId, userId)
}
async function ban (userId, duration = null) {
    const api = await broadcasterApiClient.getApiClient()
    await api.moderation.banUser(config.twitch.roomId, {user: userId, reason: '', duration: duration});
    logger.info('User unbanned: ' + userId)
}

async function unban (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.moderation.unbanUser(config.twitch.roomId, userId);
    logger.info('User unbanned: ' + userId)
}

async function addMod (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.moderation.addModerator(config.twitch.roomId, userId);
    logger.info('User added as Mod: ' + userId)
}

async function addModHandler (roomId, userId, userName) {
    await dbManager.addMod(roomId, userId, userName)
}

async function removeMod (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.moderation.removeModerator(config.twitch.roomId, userId);
    logger.info('User removed as Mod: ' + userId)
}

async function removeModHandler (roomId, userId) {
    await dbManager.removeMod(roomId, userId)
}


async function updateBlockedUsers () {
    const api = await broadcasterApiClient.getApiClient()
    const blockedUsers = await api.users.getBlocksPaginated(config.twitch.roomId)
    let blockedUsersList = []
    for await (const user of blockedUsers) {
        const line = {roomId: config.twitch.roomId, userId: user.userId, userName: user.userName }
        blockedUsersList.push(line)
    }
    if (blockedUsersList.length > 0) {
        await dbManager.clearBlocks(config.twitch.roomId)
        await dbManager.addBlocks(blockedUsersList)
    }

    logger.info('Blocked users updated: ' + blockedUsersList.length)
    return blockedUsersList
}

async function getBannedUsersCountByDate (date) {
    const bans = await dbManager.getPermanentBans(config.twitch.roomId)
    return bans.filter(ban => ban.moderatorName !== 'sery_bot' && ban.creationDate > date)
}

async function getBannedAndBlockedUsers () {
    let bans = await dbManager.getPermanentBans(config.twitch.roomId)
    const blocks = await dbManager.getBlocks(config.twitch.roomId)

    return bans
        .filter(ban => ban.moderatorName !== 'sery_bot')
        .map(ban => {
        const isBlocked = blocks.some(block => block.userId === ban.userId);
        return { ...ban, isBlocked: isBlocked, isBanned: true  };
    })
}

async function getTimeouts () {
    return dbManager.getTimeouts(config.twitch.roomId)
}

async function getVips () {
    return dbManager.getVips(config.twitch.roomId)
}

async function getMods () {
    return dbManager.getMods(config.twitch.roomId)
}

async function addBan (roomId, userId, userName, moderatorName, reason, creationDate, expiryDate) {
    await dbManager.addBan(roomId, userId, userName, moderatorName, reason, creationDate, expiryDate);
}

async function removeBan (roomId, userId) {
    await dbManager.removeBan(roomId, userId)
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

async function unBlockUser (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.users.deleteBlock(config.twitch.roomId, userId)
    logger.info('User unblocked: ' + userId)
}

async function blockUser (userId) {
    const api = await broadcasterApiClient.getApiClient()
    await api.users.createBlock(config.twitch.roomId, userId);
    logger.info('User blocked: ' + userId)
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
        logger.error('error sending announcement: ' + e)
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

async function setNotifyChannelFollowMessage (isActive) {
    return dbManager.updateChannel(config.twitch.channels, { notifyChannelFollowMessage: isActive })
}

async function setImmuneSlot1 (userId) {
    return dbManager.updateChannel(config.twitch.channels, { immuneSlot1: parseInt(userId) })
}

async function setImmuneSlot2 (userId) {
    return dbManager.updateChannel(config.twitch.channels, { immuneSlot2: parseInt(userId) })
}

async function setImmuneSlot3 (userId) {
    return dbManager.updateChannel(config.twitch.channels, { immuneSlot3: parseInt(userId) })
}

async function setImmuneSlot4 (userId) {
    return dbManager.updateChannel(config.twitch.channels, { immuneSlot4: parseInt(userId) })
}

async function setImmuneSlot5 (userId) {
    return dbManager.updateChannel(config.twitch.channels, { immuneSlot5: parseInt(userId) })
}

async function addUserIdToChannelWhitelist (userId) {
    return dbManager.addUserIdToChannelWhitelist(config.twitch.roomId, userId)
}

async function removeUserIdFromChannelWhitelist (userId) {
    return dbManager.removeUserIdFromChannelWhitelist(config.twitch.roomId, userId)
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
    getCurrentUsers,
    setNotifyChannelFollowMessage,
    updateBlockedUsers,
    addVip,
    removeVip,
    getBannedAndBlockedUsers,
    unBlockUser,
    blockUser,
    addMod,
    removeMod,
    ban,
    unban,
    addUserIdToChannelWhitelist,
    removeUserIdFromChannelWhitelist,
    isVip,
    cancelRedemption,
    acceptRedemption,
    updateVips,
    updateMods,
    addVipHandler,
    removeVipHandler,
    addModHandler,
    removeModHandler,
    getVips,
    getMods,
    setImmuneSlot1,
    setImmuneSlot2,
    setImmuneSlot3,
    setImmuneSlot4,
    setImmuneSlot5,
    isMod,
    getUserById
}


