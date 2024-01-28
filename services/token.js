const dbManager = require('../helpers/dbmanager')

function getToken (userId) {
    return dbManager.getToken(parseInt(userId)).lean()
}

function updateToken (userId, data) {
    return dbManager.updateToken(parseInt(userId), data)
}

module.exports = {
    getToken,
    updateToken
}