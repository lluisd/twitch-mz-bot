const OpenAIService = require('../services/openAI')
const LoggerService = require('../services/logger')
const TranscriptionsService = require('../services/transcriptions')
const moment = require("moment/moment");
const config = require("../config");
const logger = require('../lib/logger')

class OpenAI {
    async askOpenAI (target, text, username, twitchBot) {
        const response  = await OpenAIService.askAssistant(text, username)
        if (response) {
            if (username) {
                await twitchBot.say(target, `@${username} ${response}`)
            } else {
                await twitchBot.say(target, `${response}`)
            }

        }
    }

    async createAndUploadToChat (target, twitchBot, isToday = false) {
        const today = moment().tz('Europe/Madrid')
        const date = isToday ? today : today.subtract(1, 'days')
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const response = await LoggerService.getLogChatMessagesBetweenDays(config.twitch.roomId, startOfDay, endOfDay)
        if (response.length === 0 ) return
        const json = JSON.stringify(response)

        const formattedDate = date.format('YYYY-MM-DD');
        const result = await OpenAIService.uploadFileToVectorStore(json, formattedDate, 'chat')
        if (result.success) {
            await twitchBot.say(target, `IA actualizada con el chat de ${formattedDate}`)
            logger.info('Chat uploaded to openai ' + result.filename)
        } else {
            logger.error('Error uploading chat to openai of date ' + formattedDate)
        }
    }

    async uploadStreamToOpenai (target, twitchBot, telegramBot) {
        const { mergedJsons, blobNames } = await TranscriptionsService.getBlobs()
        let error = false
        for (const date in mergedJsons) {
            if (mergedJsons.hasOwnProperty(date)) {
                const formattedDate = moment(date, 'YYYYMMDD').format('YYYY-MM-DD');
                const result = await OpenAIService.uploadFileToVectorStore(mergedJsons[date], formattedDate, 'stream')
                if (result.success) {
                    const message = `📼 IA actualizada con el stream de ${formattedDate}`;
                    await twitchBot.say(target, message)
                    await telegramBot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' })

                    logger.info('Stream uploaded to openai ' + result.filename)
                } else {
                    error = true
                    logger.error('Error uploading stream to openai of date ' + formattedDate + ' error:' + result.error)
                }
            }
        }

        if (!error) {
            await TranscriptionsService.deleteBlobs(blobNames)
        }
    }
}

module.exports = OpenAI
