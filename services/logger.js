const dbManager = require('../helpers/dbmanager')
const moment = require('moment')

async function logChatMessage(roomId, username, text, platform) {
    let result = null
    result = await dbManager.addChatLogLine(roomId, username, text, moment(), platform)
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

function joinConsecutiveMessagesByNickWithPause(messages, maxPauseSeconds = 60) {
    if (messages.length === 0) return []

    const result = []
    let current = {...messages[0]}
    let lastDate = messages[0].date // used only for pause checking

    for (let i = 1; i < messages.length; i++) {
        const msg = messages[i]

        const diffSeconds = moment(msg.date).diff(moment(lastDate), 'seconds');

        if (msg.nick === current.nick && diffSeconds <= maxPauseSeconds) {
            current.text += " " + msg.text;
            lastDate  = msg.date // update for next comparison
        } else {
            result.push(current)
            current = {...msg}
            lastDate = msg.date
        }
    }
    result.push(current)

    return result
}

module.exports = {
    logChatMessage,
    logStreamTitle,
    getLogChatMessagesBetweenDays,
    joinConsecutiveMessagesByNickWithPause
}
