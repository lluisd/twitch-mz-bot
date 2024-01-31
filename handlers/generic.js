class Generic {
    rollDice (target, bot) {
        const num = this._rollDice();
        bot.say(target, `Ha salido el número ${num}`);
    }

    _rollDice () {
        const sides = 6;
        return Math.floor(Math.random() * sides) + 1;
    }
}

module.exports = Generic
