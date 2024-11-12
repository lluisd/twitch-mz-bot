const OpenAIService = require('../services/openAI')
const LoggerService = require('../services/logger')
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
        const result = await OpenAIService.uploadFileToVectorStore(json, formattedDate)
        if (result.success) {
            bot.say(target, `IA actualizada con el chat de ${formattedDate}`)
            console.log('Chat uploaded to openai ' + result.filename)
        } else {
            console.log('Error uploading chat to openai of date ' + formattedDate)
        }
    }
}

module.exports = OpenAI
