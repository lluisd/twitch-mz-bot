const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Municipio Schema */
const MunicipioSchema = new Schema({
    codigoProvincia: {
        type: String,
        required: true
    },
    codigoMunicipio: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
})

module.exports = mongoose.model('municipio', MunicipioSchema, 'municipios')
