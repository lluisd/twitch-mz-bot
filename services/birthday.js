const dbManager = require('../helpers/dbmanager')

async function getBirthday(nick) {
    let result = null
    result = await dbManager.getBirthday(nick)
    return result
}

async function addBirthday(nick, day, month) {
    return await dbManager.updateBirthday(nick, {day: day, month: month})
}


module.exports = {
    getBirthday,
    addBirthday
}
