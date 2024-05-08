const config = require('../config')

const endpointPrefix = 'https://opendata.aemet.es/opendata/api/'

async function getSunsetPrediction(name) {
    let sunsetTime = null
    const result = await _getTimePrediction(name)
    if (result && result.length > 1) {
        sunsetTime = result[0].prediccion.dia[0].ocaso
    }
    return sunsetTime
}

async function getSunrisePrediction(name) {
    let sunsetTime = null
    const result = await _getTimePrediction(name)
    if (result && result.length > 1) {
        sunsetTime = result[0].prediccion.dia[0].orto
    }
    return sunsetTime
}

async function _getTimePrediction(name) {
    let result = null
    const endpoint = endpointPrefix + 'prediccion/especifica/municipio/horaria/' + name
    const options = {
        headers: {
            'accept': 'application/json',
            'api_key': config.aemet.apiKey
        }
    }
    const response = await fetch(endpoint, options)
    const data = await response.json()
    return await getAemetData(data.datos)
}
async function getAemetData(url) {
    const response = await fetch(url)
    return await response.json()
}

module.exports = {
    getSunsetPrediction,
    getSunrisePrediction
}
