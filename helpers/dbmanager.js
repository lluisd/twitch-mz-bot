const Token = require('../models/token')
const Muncipio = require('../models/municipio')
const Channel = require('../models/channel')
const Birthday = require('../models/birthday')
const Screenshot = require('../models/screenshot')
const moment = require('moment')


function getToken (userId) {
    return Token.findOne({userId: userId})
}

function updateToken (userId, update) {
    return Token.updateOne({userId: userId}, update)
}

function getChannel (name) {
    return Channel.findOne({name: name})
}

function updateChannel (name, update) {
    return Channel.updateOne({name: name}, {...update, lastUpdate: new Date() })
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

async function getBirthday (nick) {
    return Birthday.findOne({nick: nick}).lean()
}

async function updateBirthday (nick, update) {
    return Birthday.findOneAndUpdate({nick: nick}, update, {
        new: true,
        upsert: true
    }).lean()
}

async function getBirthdayFromDate(day, month) {
    return Birthday.find({day: day, month: month}).lean()
}

async function updateScreenshot (name, update) {
    return Screenshot.findOneAndUpdate({name: name}, update, {
        new: true,
        upsert: true
    }).lean()
}

async function getScreenshots(streamId) {
    return Screenshot.find({streamId: streamId}).lean()
}


module.exports = {
    getToken,
    updateToken,
    getMunicipio,
    getMuncipioStartsWith,
    getMuncipioEndsWith,
    getMuncipioContains,
    getChannel,
    updateChannel,
    updateBirthday,
    getBirthday,
    getBirthdayFromDate,
    updateScreenshot,
    getScreenshots
}
