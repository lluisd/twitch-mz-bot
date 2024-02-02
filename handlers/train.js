const RenfeService = require('../services/renfe')

class Train {
    async getNextMD (target, text, bot) {
        const result  = await RenfeService.getNextMD(this._getOrigin(text), this._getDestination(text))

        if (result) {
            bot.say(target, `Próximo tren MD de ${result.origin_stop} a ${result.destination_stop} sale a las ${result.time}`);
        }
    }
    async getNextAVE (target, text, bot) {
        const result  = await RenfeService.getNextAVE(this._getOrigin(text), this._getDestination(text))

        if (result) {
            bot.say(target, `Próximo AVE de ${result.origin_stop} a ${result.destination_stop} sale a las ${result.time} y llega a las ${result.arrival_time}`);
        }
    }

    _getOrigin (text) {
        return text.split(',')[0].trim()
    }

    _getDestination (text) {
        return text.split(',')[1].trim()
    }
}

module.exports = Train
