const Token = require('../models/token')
const Muncipio = require('../models/municipio')
const Channel = require('../models/channel')
const Birthday = require('../models/birthday')
const Strike = require('../models/strike')
const Immune = require('../models/immune')
const Ban = require('../models/ban')
const Vip = require('../models/vip')
const Mod = require('../models/mod')
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

async function setBanToImmune (userId) {
    return Immune.findOneAndUpdate(
        {userId: parseInt(userId)},
        { $inc: { bans: 1 } },
        { new: true}
    ).lean()
}

async function setImmuneWithSlot (userId, slotNumber, expiryDate) {
    return Immune.findOneAndUpdate(
        {userId: parseInt(userId)},
        { slot: slotNumber, bans: 0, expiryDate: expiryDate },
        {new: true, upsert: true}
    ).lean()
}

async function deleteImmune (userId) {
    return Immune.deleteOne({userId: parseInt(userId)})
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

async function getImmune (userId) {
    return Immune.findOne({userId: userId}).lean()
}

async function getImmunes () {
    return Immune.find({}).lean()
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
        {roomId: parseInt(roomId), userId: userId },
        { moderatorName: moderatorName, userName: userName,
            reason: reason, creationDate: creationDate, expiryDate: expiryDate },
        {new: true, upsert: true}
    ).lean()
}

async function addVip (roomId, userId, userName) {
    return Vip.findOneAndUpdate(
        {roomId: parseInt(roomId), userId: userId },
        {  userName: userName },
        {new: true, upsert: true}
    ).lean()
}

async function addMod (roomId, userId, userName) {
    return Mod.findOneAndUpdate(
        {roomId: parseInt(roomId), userId: userId },
        {  userName: userName },
        {new: true, upsert: true}
    ).lean()
}

async function removeBan (roomId, userId) {
    return Ban.deleteOne({roomId: parseInt(roomId), userId: userId})
}

async function removeVip (roomId, userId) {
    return Vip.deleteOne({roomId: parseInt(roomId), userId: userId})
}

async function removeMod (roomId, userId) {
    return Mod.deleteOne({roomId: parseInt(roomId), userId: userId})
}

async function addBans (bans) {
    return Ban.insertMany(bans)
}

async function addVips (vips) {
    return Vip.insertMany(vips)
}

async function addMods (mods) {
    return Mod.insertMany(mods)
}

async function addBlocks (blocks) {
    return Block.insertMany(blocks)
}

async function clearBans (roomId) {
    return Ban.deleteMany({roomId: parseInt(roomId)});
}

async function clearVips (roomId) {
    return Vip.deleteMany({roomId: parseInt(roomId)});
}

async function clearMods (roomId) {
    return Mod.deleteMany({roomId: parseInt(roomId)});
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

async function getVips(roomId) {
    return Vip.find({roomId: parseInt(roomId) }).lean()
}

async function getMods(roomId) {
    return Mod.find({roomId: parseInt(roomId) }).lean()
}

async function addUserIdToChannelWhitelist(roomId, userId) {
    await Channel.findOneAndUpdate(
        { roomId: parseInt(roomId) },
        { $addToSet: { whitelistUsers: parseInt(userId) } },
        { new: true }
    )
}

async function removeUserIdFromChannelWhitelist(roomId, userId) {
    await Channel.findOneAndUpdate(
        { roomId: parseInt(roomId) },
        { $pull: { whitelistUsers: parseInt(userId) } },
    )
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
    removeUserIdFromChannelWhitelist,
    clearVips,
    clearMods,
    addMods,
    addVips,
    addVip,
    addMod,
    removeMod,
    removeVip,
    getVips,
    getMods,
    setBanToImmune,
    setImmuneWithSlot,
    deleteImmune,
    getImmunes,
    getImmune
}
