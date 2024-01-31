const MunicipioService = require('../services/municipio')
const AemetService = require('../services/aemet')

class Weather {
    async getAemet (target, text, bot) {
        const municipio  = await MunicipioService.getMunicipioCode(text)

        if (municipio !== null) {
            const code = `${municipio.codigoProvincia}${municipio.codigoMunicipio}`
            const ocaso = await AemetService.getTimePrediction(code)
            bot.say(target, `${municipio.nombre} atardece a las ${ocaso}`);
        }
    }


}

module.exports = Weather
