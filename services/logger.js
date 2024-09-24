const dbManager = require('../helpers/dbmanager')
const moment = require('moment')

async function logMessage(roomId, username, text) {
    let result = null
    result = await dbManager.addLogLine(roomId, username, text, moment())
    return result
}


module.exports = {
    logMessage
}
