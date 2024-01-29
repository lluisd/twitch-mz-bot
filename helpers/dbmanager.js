const Token = require('../models/token')
const Muncipio = require('../models/municipio')

function getToken (userId) {
    return Token.findOne({userId: userId})
}

function updateToken (userId, update) {
    return Token.updateOne({userId: userId}, update)
}

async function getMuncipioStartsWith (name) {
    return Muncipio.findOne({nombre: { "$regex": "^" + name , "$options": "i"}}).lean()
}

async function getMuncipioEndsWith (name) {
    return Muncipio.findOne({nombre: { "$regex": name + "$", "$options": "i"}}).lean()
}

async function getMuncipioContains (name) {
    return Muncipio.findOne({nombre: { "$regex": name, "$options": "i"}}).lean()
}

async function getMunicipio (name) {
    return Muncipio.findOne({nombre: { "$regex": "^" + name + "$", "$options": "i"}}).lean()
}

module.exports = {
    getToken,
    updateToken,
    getMunicipio,
    getMuncipioStartsWith,
    getMuncipioEndsWith,
    getMuncipioContains
}
