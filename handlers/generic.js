const config = require("../config")
const randomLinks = require("../config/randomLinks.json");

class Generic {
    rollDice (target, bot) {
        const num = this._rollDice();
        bot.say(target, `Ha salido el número ${num}`)
    }

    _rollDice () {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1
    }

    status (target, bot) {
        bot.say(target, `${config.statusUrl}`)
    }

    randomYoutubeLink (target, bot) {
        const position = Math.floor(Math.random() * randomLinks.links.length)
        bot.say(target, `Mi OF ${config.externalUrl}/OF/${config.twitch.channels}${position}`)
    }

    setTitle (target, text, bot) {
        bot.say(target, `!title ${text}`)
    }
}


module.exports = Generic
