const RenfeService = require('../services/renfe')

class Train {
    async getNextMD (target, originText, destinationText, bot) {
        const result  = await RenfeService.getNextMD(originText, destinationText)

        if (result) {
            bot.say(target, `Próximo tren MD de ${result.origin_stop} a ${result.destination_stop} sale a las ${result.time}`);
        }
    }
    async getNextAVE (target, originText, destinationText, bot) {
        const result  = await RenfeService.getNextAVE(originText, destinationText)

        if (result) {
            bot.say(target, `Próximo AVE de ${result.origin_stop} a ${result.destination_stop} sale a las ${result.time}`);
        }
    }
}

module.exports = Train