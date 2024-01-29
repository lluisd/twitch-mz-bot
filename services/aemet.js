const config = require('../config')

const endpointPrefix = 'https://opendata.aemet.es/opendata/api/'
async function getTimePrediction(name) {
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
    result = await getAemetData(data.datos)

    return result[0].prediccion.dia[0].ocaso
}


async function getAemetData(url) {
    const response = await fetch(url)
    return await response.json()
}

module.exports = {
    getTimePrediction
}
