const sqlManager = require('../helpers/mariadbManager')

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
