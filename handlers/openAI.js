const OpenAIService = require('../services/openAI')

class OpenAI {
    async askOpenAI (target, text, username, bot) {
        const response  = await OpenAIService.askAssistant(text)
        if (response) {
            bot.say(target, `@${username} ${response}`)
        }
    }
}

module.exports = OpenAI
