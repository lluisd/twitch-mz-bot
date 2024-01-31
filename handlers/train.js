const RenfeService = require('../services/renfe')

class Train {
    async getTrainTime (target, originText, destinationText, bot) {
        const result  = await RenfeService.getMDTrain(originText, destinationText)

        if (result) {
            bot.say(target, `El próximo tren MD sale a las ${result.time} de la ${result.origin_stop} con destino ${result.destination_stop}`);
        }
    }
}

module.exports = Train