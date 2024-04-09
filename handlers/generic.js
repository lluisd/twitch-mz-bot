const config = require("../config")

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
}

module.exports = Generic
