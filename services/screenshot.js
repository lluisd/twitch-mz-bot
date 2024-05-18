const dbManager = require('../helpers/dbmanager')
const moment = require('moment')

async function addScreenshot(name, streamId, capturedBy, roomId) {
    return await dbManager.updateScreenshot(name, {streamId: streamId, capturedBy: capturedBy, roomId: roomId, created: moment()})
}

async function getScreenshots(streamId) {
    if (streamId) {
        return await dbManager.getScreenshots(streamId)
    } else {
        return []
    }

}

module.exports = {
    addScreenshot,
    getScreenshots
}
