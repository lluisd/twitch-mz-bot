const dbManager = require('../helpers/dbmanager')
const moment = require('moment')
const mongoose = require('mongoose');

async function logMessage(username, text) {
    let result = null
    result = await dbManager.getBirthday(nick)
    return result
}

async function addBirthday(nick, day, month) {
    return await dbManager.updateBirthday(nick, {day: day, month: month})
}

async function getTodayBirthdays() {
    let result = null
    const today = moment()
    result = await dbManager.getBirthdayFromDate(today.date(), today.month() + 1)
    return result
}


module.exports = {
    getBirthday,
    addBirthday,
    getTodayBirthdays
}
