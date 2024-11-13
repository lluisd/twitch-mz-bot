const OpenAIService = require('../services/openAI')
const LoggerService = require('../services/logger')
const TranscriptionsService = require('../services/transcriptions')
const moment = require("moment/moment");

class OpenAI {
    async askOpenAI (target, text, username, bot) {
        const response  = await OpenAIService.askAssistant(text)
        if (response) {
            bot.say(target, `@${username} ${response}`)
        }
    }

    async createAndUploadToChat (target, bot, isToday = false) {
        const today = moment().tz('Europe/Madrid')
        const date = isToday ? today : today.subtract(1, 'days')
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const response = await LoggerService.getLogChatMessagesBetweenDays(config.twitch.roomId,startOfDay, endOfDay)
        const json = JSON.stringify(response)

        const formattedDate = date.format('YYYY-MM-DD');
        const result = await OpenAIService.uploadFileToVectorStore(json, formattedDate, 'chat')
        if (result.success) {
            bot.say(target, `IA actualizada con el chat de ${formattedDate}`)
            console.log('Chat uploaded to openai ' + result.filename)
        } else {
            console.log('Error uploading chat to openai of date ' + formattedDate)
        }
    }

    async uploadStreamToOpenai (target, bot) {
        const { mergedJsons, blobNames } = await TranscriptionsService.getBlobs()
        let error = false
        for (const date in mergedJsons) {
            if (mergedJsons.hasOwnProperty(date)) {
                const formattedDate = moment(date, 'YYYYMMDD').format('YYYY-MM-DD');
                const result = await OpenAIService.uploadFileToVectorStore(mergedJsons[date], formattedDate, 'stream')
                if (result.success) {
                    bot.say(target, `IA actualizada con el stream de ${formattedDate}`)
                    console.log('Stream uploaded to openai ' + result.filename)
                } else {
                    error = true
                    console.log('Error uploading stream to openai of date ' + formattedDate)
                }
            }
        }

        if (!error) {
            await TranscriptionsService.deleteBlobs(blobNames)
        }
    }
}

module.exports = OpenAI
