const Token = require('../models/token')
const Muncipio = require('../models/municipio')
const Channel = require('../models/channel')
const Birthday = require('../models/birthday')
const Strike = require('../models/strike')
const Ban = require('../models/ban')
const Block = require('../models/block')
const Screenshot = require('../models/screenshot')
const tempsDeFlors = require('../models/tempsDeFlors')
const logConn = require('../db.openai')

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
    return Channel.findOneAndUpdate({name: name}, {...update })
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

async function setStrike (userId) {
    return Strike.findOneAndUpdate(
        {userId: parseInt(userId)},
        { $inc: { number: 1, total: 1 } },
        {new: true, upsert: true}
    ).lean()
}

async function resetStrike (userId) {
    return Strike.findOneAndUpdate(
        {userId: parseInt(userId)},
        { number: 0},
        {new: true, upsert: true}
    ).lean()
}

async function getStrikes (userId) {
    return Strike.findOne({userId: userId}).lean()
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

async function getTFSpot(roomId, number){
    return tempsDeFlors.findOne({number: number, roomId: parseInt(roomId)}).lean()
}

async function setTFSpot(roomId, number, update, returnOldDoc){
    const options = !returnOldDoc ? {returnNewDocument: true, returnDocument: 'after'} : {}
    return tempsDeFlors.findOneAndUpdate({roomId: parseInt(roomId), number: number}, {...update }, options).lean()
}


async function getTFSpots(roomId){
    return tempsDeFlors.find({roomId: parseInt(roomId)}).sort('number').lean()
}

async function addChatLogLine (roomId, nick, text, date) {
    const conn = await logConn.getConnection()
    return conn.model('chatLog').insertMany({roomId: roomId, nick: nick, text: text, date: date})
}

async function getChatLogLines (roomId, startOfDay, endOfDay) {
    const conn = await logConn.getConnection()
    return conn.model('chatLog')
        .find({roomId: roomId, date: { $gte: startOfDay, $lt: endOfDay }})
        .select('nick text date -_id').lean()
}

async function addTitleLogLine (roomId, title, date) {
    const conn = await logConn.getConnection()
    return conn.model('titleLog').insertMany({roomId: roomId, title: title, date: date})
}

async function addBan (roomId, userId, userName, moderatorName, reason, creationDate, expiryDate) {
    return Ban.findOneAndUpdate(
        {roomId: parseInt(roomId), userName: userName },
        { moderatorName: moderatorName, userId: userId,
            reason: reason, creationDate: creationDate, expiryDate: expiryDate },
        {new: true, upsert: true}
    ).lean()
}

async function removeBan (roomId, userId) {
    return Ban.deleteOne({roomId: parseInt(roomId), userId: userId})
}

async function addBans (bans) {
    return Ban.insertMany(bans)
}

async function addBlocks (blocks) {
    return Block.insertMany(blocks)
}

async function clearBans (roomId) {
    return Ban.deleteMany({roomId: parseInt(roomId)});
}

async function clearBlocks (roomId) {
    return Block.deleteMany({roomId: parseInt(roomId)});
}

async function getPermanentBans(roomId) {
    return Ban.find({roomId: parseInt(roomId), expiryDate: null}).sort({ creationDate: -1 }).lean()
}

async function getBlocks(roomId) {
    return Block.find({roomId: parseInt(roomId)}).lean()
}

async function getTimeouts(roomId) {
    return Ban.find({roomId: parseInt(roomId), expiryDate: { $ne: null }}).lean()
}

async function addUserIdToChannelWhitelist(roomId, userId) {
    await Channel.findByIdAndUpdate(
        roomId,
        { $addToSet: { whitelistUsers: parseInt(userId) } },
        { new: true }
    );
}

async function removeUserIdFromChannelWhitelist(roomId, userId) {
    await Channel.findByIdAndUpdate(
        roomId,
        { pull: { whitelistUsers: parseInt(userId) } },
        { new: true }
    );
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
    getScreenshots,
    getTFSpot,
    getTFSpots,
    setTFSpot,
    addTitleLogLine,
    addChatLogLine,
    addBan,
    clearBans,
    addBans,
    getPermanentBans,
    getTimeouts,
    removeBan,
    getChatLogLines,
    getStrikes,
    setStrike,
    resetStrike,
    clearBlocks,
    addBlocks,
    getBlocks,
    addUserIdToChannelWhitelist,
    removeUserIdFromChannelWhitelist
}
