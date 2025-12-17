const logger = require('../lib/logger')
const WhisperService = require("../services/whisper")
const config = require("../config");
const TwitchService = require("../services/twitch")
const Logger = require("../services/logger");
const kickUrl = 'https://kick.com/'

class Kick {

    async webhookHandler(eventType, payload, telegramBot) {
        try {
            switch (eventType) {
                case 'livestream.status.updated':
                    await this.liveStreamStatusUpdated(payload, telegramBot)
                    break
                case 'chat.message.sent':
                    await this.chatMessageSent(payload)
                    break
                default:
                    logger.warn(`Unhandled Kick event type: ${eventType}`)
            }
        } catch (error) {
            logger.error('Kick webhook error:', error)
        }
    }

    async chatMessageSent(message) {
        logger.info(`Kick - message from ${message.sender.channel_slug} in #${message.broadcaster.channel_slug}: ${message.content}`)
        if (config.kick.channel === message.sender.channel_slug) return
        await Logger.logChatMessage(config.twitch.roomId, message.sender.channel_slug, message.content, 'kick')
    }

    async liveStreamStatusUpdated(stream, telegramBot) {
        if (!stream || typeof stream.is_live !== 'boolean') {
            logger.warn('Invalid kick stream payload received:', stream)
            return
        }
        try {
            const username = stream.broadcaster?.username ?? 'unknown'
            const options = { parse_mode: 'Markdown' }

            if (stream.is_live) {
                logger.debug(`Stream ${username} in Kick has started!`)
                const text = this._getText(stream)
                const msg = await telegramBot.sendMessage(config.telegram.chatId, text, options)
                await telegramBot.pinChatMessage(config.telegram.chatId, msg.message_id).catch((err) => { logger.error(`cannot pin kick stream live on telegram message: ${err}`)})
                await TwitchService.saveLastMessage(msg)
                await WhisperService.start()
            } else {
                logger.debug(`Stream ${username} in Kick has ended!`)
                const channel = await TwitchService.getChannel()
                if (channel && channel.lastMessageId) {
                    await telegramBot.unpinChatMessage(config.telegram.chatId, {message_id: channel.lastMessageId}).catch((err) => { logger.error(`cannot unpin kick stream live on telegram message: ${err}`)})
                    await telegramBot.deleteMessage(config.telegram.chatId, channel.lastMessageId).catch((err) => { logger.error(`cannot delete message: ${err}`)})
                }
                await TwitchService.saveLastMessage({ message_id: null})
                await WhisperService.stop()
            }

        } catch (error) {
            logger.error('Error on kick stream:', error)
        }
    }

    _getText (stream) {
        const image = `[\u200c](${stream.broadcaster.profile_picture})`
        const link = `[${kickUrl}${stream.broadcaster.username}](${kickUrl}${stream.broadcaster.username})`
        const title = `🟢 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.title}_`
    }
}

module.exports = Kick


