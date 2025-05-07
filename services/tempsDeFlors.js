const dbManager = require('../helpers/dbmanager')
const moment = require('moment-timezone')
const config = require('../config')

async function getTFSpot(roomId, number) {
    return await dbManager.getTFSpot(roomId, number)
}

async function setTFVisited(roomId, number, state, returnOldDoc = false) {
    return await dbManager.setTFSpot(roomId, number , {screenshot: null, created: null, capturedBy: null, visited: state }, returnOldDoc)
}

async function setTFScreenshot(roomId, number, screenshot, displayName) {
    return await dbManager.setTFSpot(roomId, number , { screenshot: screenshot, created: moment().tz('Europe/Madrid'), capturedBy:displayName })
}

async function getTFSpots(roomId) {
    return await dbManager.getTFSpots(roomId)
}

module.exports = {
    getTFSpot,
    setTFVisited,
    getTFSpots,
    setTFScreenshot
}
