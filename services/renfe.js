const sqlManager = require('../helpers/mysqlManager')

async function getNextMD (origin, destination) {
    return sqlManager.getCloserFutureTrain(origin, destination, 'MD')
}

async function getNextAVE (origin, destination) {
    return sqlManager.getCloserFutureTrain(origin, destination, 'AVE')
}

module.exports = {
    getNextMD,
    getNextAVE
}
