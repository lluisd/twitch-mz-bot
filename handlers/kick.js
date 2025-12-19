const logger = require('../lib/logger')
const WhisperService = require("../services/whisper")
const config = require("../config")
const KickService = require("../services/kick")
const TwitchService = require("../services/twitch")
const Logger = require("../services/logger")
const moment = require('moment')
require('moment-precise-range-plugin')
const kickUrl = 'https://kick.com/'
const hasStarted = false

class Kick {
    async catchStream (telegramBot) {
        try {
            const liveStream = await KickService.getLiveStream()

            if (liveStream?.data.length > 0) {
                const stream = liveStream?.data?.[0]
                const channel = await TwitchService.getChannel()
                if (channel && channel.lastMessageId) {
                    logger.debug(`Stream ${config.kick.channel} in Kick continues live`)
                    if (!channel.live) {
                        await TwitchService.setChannelLive(true)
                        await WhisperService.start()
                    }

                    const options = {
                        chat_id: config.telegram.chatId,
                        message_id: channel.lastMessageId,
                        parse_mode: 'Markdown'
                    }
                    await telegramBot.editMessageText(this._getTextFromLiveStream(stream), options)
                        .catch((err) => { logger.error(`cannot edit message: ${err}`)})
                }
            }
        } catch (e) {
            logger.error("catch kick stream error:", error)
        }

    }

    async webhookHandler(eventType, payload, telegramBot) {
        try {
            if (!config.kick.enabled) return
            switch (eventType) {
                case 'livestream.status.updated':
                    await this._liveStreamStatusUpdated(payload, telegramBot)
                    break
                case 'chat.message.sent':
                    await this._chatMessageSent(payload)
                    break
                default:
                    logger.warn(`Unhandled Kick event type: ${eventType}`)
            }
        } catch (error) {
            logger.error('Kick webhook error:', error)
        }
    }

    async _chatMessageSent(message) {
        logger.info(`Kick - message from ${message.sender.channel_slug} in #${message.broadcaster.channel_slug}: ${message.content}`)
        if (config.kick.channel === message.sender.channel_slug) return
        await Logger.logChatMessage(config.twitch.roomId, message.sender.channel_slug, message.content, 'kick')
    }

    async _liveStreamStatusUpdated(stream, telegramBot) {
        if (!config.twitch.enabled && !stream || typeof stream.is_live !== 'boolean') {
            logger.warn('Invalid kick stream payload received:', stream)
            return
        }
        try {
            const username = stream.broadcaster?.username ?? 'unknown'
            const options = { parse_mode: 'Markdown' }

            if (stream.is_live) {
                logger.debug(`Stream ${username} in Kick has started!`)
                const text = this._getTextFromWebhook(stream)
                const msg = await telegramBot.sendMessage(config.telegram.chatId, text, options)
                await telegramBot.pinChatMessage(config.telegram.chatId, msg.message_id).catch((err) => { logger.error(`cannot pin kick stream live on telegram message: ${err}`)})
                await TwitchService.saveLastMessage(msg)
            } else {
                logger.debug(`Stream ${username} in Kick has ended!`)
                const channel = await TwitchService.getChannel()
                if (channel && channel.lastMessageId) {
                    await telegramBot.unpinChatMessage(config.telegram.chatId, {message_id: channel.lastMessageId}).catch((err) => { logger.error(`cannot unpin kick stream live on telegram message: ${err}`)})
                    await telegramBot.deleteMessage(config.telegram.chatId, channel.lastMessageId).catch((err) => { logger.error(`cannot delete message: ${err}`)})
                }
                await TwitchService.setChannelLive(false)
                await TwitchService.saveLastMessage({ message_id: null})
                await WhisperService.stop()
            }

        } catch (error) {
            logger.error('Error on kick stream:', error)
        }
    }

    _getTextFromWebhook (stream) {
        const image = `[\u200c](${stream.broadcaster.profile_picture})`
        const link = `[${kickUrl}${stream.broadcaster.channel_slug}](${kickUrl}${stream.broadcaster.channel_slug})`
        const title = `🟢 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.title}_ (0)`
    }

    _getTextFromLiveStream (stream) {
        const end = moment()
        const start = moment(stream.started_at)
        const diff = moment.preciseDiff(start, end, true)
        const horas = diff.hours > 0 ? `${diff.hours} horas ` : ''
        const duration = `${horas}${diff.minutes} minutos`

        const image = `[\u200c](${stream.thumbnail}?a=${Date.now()})`
        const link = `[${kickUrl}${stream.slug}](${kickUrl}${stream.slug})`
        const title = `🟣 *¡EN DIRECTO!*`
        return `${image} ${title}  ${link} \n _${stream.stream_title}_ (${duration}) ${stream.viewer_count} espectadores`
    }
}

module.exports = Kick


