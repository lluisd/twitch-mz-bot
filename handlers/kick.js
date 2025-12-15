const logger = require('../lib/logger')
const WhisperService = require("../services/whisper")

class Kick {
    async liveStreamStatusUpdated(stream) {
        if (!stream || typeof stream.is_live !== 'boolean') {
            logger.warn('Invalid kick stream payload received:', stream)
            return
        }
        try {
            const username = stream.broadcaster?.username ?? 'unknown'

            if (stream.is_live) {
                logger.debug(`Stream ${username} in Kick has started!`)
                await WhisperService.start()
            } else {
                logger.debug(`Stream ${username} in Kick has ended!`)
                await WhisperService.stop()
            }

        } catch (error) {
            logger.error('Error on kick stream:', error)
        }
    }
}

module.exports = Kick


