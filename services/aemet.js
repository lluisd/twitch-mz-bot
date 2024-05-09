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

    try {
        const response = await fetch(endpoint, options)
        const data = await response.json()
        if (data?.datos) {
            result = await getAemetData(data.datos)
        }
    } catch {
        result = null
    }

    return result
}
async function getAemetData(url) {
    let result = null
    try {
        const response = await fetch(url)
        result = await response.json()

    } catch {
        result = null
    }

    return result
}

module.exports = {
    getSunsetPrediction,
    getSunrisePrediction
}
