const Token = require('../models/token')

function getToken (userId) {
    return Token.findOne({userId: userId})
}

function updateToken (userId, update) {
    return Token.updateOne({userId: userId}, update)
}

module.exports = {
    getToken,
    updateToken
}