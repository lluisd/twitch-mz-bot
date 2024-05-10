const dbManager = require('../helpers/dbmanager')
const moment = require('moment')
const config = require('../config')

async function getTFSpot(roomId, number) {
    return await dbManager.getTFSpot(roomId, number)
}

async function setTFVisited(roomId, number, state, returnOldDoc = false) {
    return await dbManager.setTFSpot(roomId, number , {screenshot: null, screenshotOn: null, visited: state, visitedOn: moment() }, returnOldDoc)
}

async function setTFScreenshot(roomId, number, screenshot) {
    return await dbManager.setTFSpot(roomId, number , { screenshot: screenshot, screenshotOn: moment() })
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
