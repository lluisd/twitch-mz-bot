const dbManager = require('../helpers/dbmanager')
const moment = require('moment')

async function logChatMessage(roomId, username, text) {
    let result = null
    result = await dbManager.addChatLogLine(roomId, username, text, moment())
    return result
}

async function logStreamTitle(roomId, title) {
    let result = null
    result = await dbManager.addTitleLogLine(roomId, title, moment())
    return result
}

async function getLogChatMessagesBetweenDays(roomId, startOfDay, endOfDay) {
    let result = null
    result = await dbManager.getChatLogLines(roomId, startOfDay, endOfDay)
    return result
}


module.exports = {
    logChatMessage,
    logStreamTitle,
    getLogChatMessagesBetweenDays
}
