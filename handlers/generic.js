const config = require("../config")
const randomLinks = require("../config/randomLinks.json");

class Generic {
    async rollDice (target, bot) {
        const num = this._rollDice();
        await bot.say(target, `Ha salido el número ${num}`)
    }

    _rollDice () {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1
    }

    async status (target, bot) {
        await bot.say(target, `${config.statusUrl}`)
    }

    async randomYoutubeLink (target, bot) {
        const position = Math.floor(Math.random() * randomLinks.links.length)
        await bot.say(target, `Mi OF ${config.externalUrl}/OF/${config.twitch.channels}${position}`)
    }
}


module.exports = Generic
