const dbManager = require('../helpers/dbmanager')
const moment = require('moment')
const config = require('../config')

async function logChatMessage(roomId, username, text) {
    let result = null
    if (config.openAI.logging) {
        result = await dbManager.addChatLogLine(roomId, username, text, moment())
    }
    return result
}

async function logStreamTitle(roomId, title) {
    let result = null
    if (config.openAI.logging) {
        result = await dbManager.addTitleLogLine(roomId, title, moment())
    }
    return result
}


module.exports = {
    logChatMessage,
    logStreamTitle
}
