const dbManager = require('../helpers/dbmanager')
const config = require("../config");
const logger = require('../lib/logger')

async function start () {
    let result
    let options = await _getHeaders()
    options.method = 'POST'
    const endpoint = config.whisper.endpoint + '/start/' + config.twitch.channels

    try {
        const response = await fetch(endpoint, options)
        result = await response.json()
        dbManager.updateChannel(config.twitch.channels, { audioFile: result.filename, audioPID: result.pid })
    } catch (e) {
        logger.error(e)
        result = null
    }

    return result
}

async function stop () {
    let result
    let options = await _getHeaders()
    options.method = 'POST'
    const endpoint = config.whisper.endpoint + '/stop'

    try {
        const response = await fetch(endpoint, options)
        result = await response.json()
        dbManager.updateChannel(config.twitch.channels, { audioFile: null, audioPID: null })
    } catch (e) {
        logger.error(e)
        result = null
    }

    return result
}

async function _getHeaders () {
    return {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
}

module.exports = {
    start,
    stop
}
