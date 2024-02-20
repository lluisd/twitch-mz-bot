const BirthdayService = require('../services/birthday')

const monthTexts = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"]

class Birthday {
    async addBirthday (target, text, bot, name) {
        const day = this._getDay(text)
        const month = this._getMonth(text)
        const nick = name.toLowerCase()

        const result = await BirthdayService.addBirthday(nick, day, month)
        if (result) {
            bot.say(target, this._getText(result))
        }
    }

    async getBirthday (target, text, bot) {
        const nick = text.trim().replace('@', '').toLowerCase()
        const result  = await BirthdayService.getBirthday(nick)

        if (result) {
            bot.say(target, this._getText(result))
        }
    }

    _getText(model) {
        return `${model.nick} cumple el dia ${model.day} de ${monthTexts[model.month -1]}`
    }

    _getDay (text) {
        return parseInt(text.split('-')[0].trim())
    }

    _getMonth (text) {
        return parseInt(text.split('-')[1].trim())
    }
}

module.exports = Birthday
