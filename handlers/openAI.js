const OpenAIService = require('../services/openAI')

class OpenAI {
    async askOpenAI (target, text, bot) {
        const response  = await OpenAIService.askOpenAI(text)
        bot.say(target, `${response}`)
    }
}

module.exports = OpenAI