const MunicipioService = require('../services/municipio')
const AemetService = require('../services/aemet')

class Weather {
    async getSunset (target, text, bot) {
        const municipio  = await MunicipioService.getMunicipioCode(text)
        if (municipio !== null) {
            const code = `${municipio.codigoProvincia}${municipio.codigoMunicipio}`
            const sunsetTime = await AemetService.getSunsetPrediction(code)
            if (sunsetTime) {
                await bot.say(target, `${municipio.nombre} atardece a las ${sunsetTime}`)
            }
        }
    }

    async getSunrise (target, text, bot) {
        const municipio  = await MunicipioService.getMunicipioCode(text)
        if (municipio !== null) {
            const code = `${municipio.codigoProvincia}${municipio.codigoMunicipio}`
            const sunriseTime = await AemetService.getSunrisePrediction(code)
            if (sunriseTime) {
                await bot.say(target, `${municipio.nombre} amanece a las ${sunriseTime}`)
            }
        }
    }
}

module.exports = Weather