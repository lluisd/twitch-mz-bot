const sqlManager = require('../helpers/sqlManager')

async function getMDTrain (origin, destination) {
    return sqlManager.getTrainMDTime(origin, destination)
}

module.exports = {
    getMDTrain
}
