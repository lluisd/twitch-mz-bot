const dbManager = require('../helpers/dbmanager')

async function getStrikes(userId) {
    let result
    result = await dbManager.getStrikes(userId)
    return result
}

async function setStrike (userId) {
    return await dbManager.setStrike(userId)
}

async function resetStrike (userId) {
    return await dbManager.resetStrike(userId)
}

module.exports = {
    getStrikes,
    setStrike,
    resetStrike
}
