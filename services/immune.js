const dbManager = require('../helpers/dbmanager')
const moment = require('moment')
const TwitchService = require('./twitch')
const config = require('../config')

async function getImmunes() {
    return await dbManager.getImmunes()
}

async function increaseBan (userId) {
    return await dbManager.setBanToImmune(userId)
}

async function removeImmune (userId) {
    const immune = await dbManager.getImmune(userId)
    if (immune) {
        await _deleteImmune(immune.userId, immune.slot)
    }
}

async function addImmune (userId, slotNumber) {
    return await dbManager.setImmuneWithSlot(userId, slotNumber, moment().add(24, 'hours'))
}

async function _deleteImmune(userId, slot) {
    await dbManager.deleteImmune(userId)
    switch (slot) {
        case 1:
            await TwitchService.enableCustomReward(config.customReward.immuneSlot1)
            break
        case 2:
            await TwitchService.enableCustomReward(config.customReward.immuneSlot2)
            break
        case 3:
            await TwitchService.enableCustomReward(config.customReward.immuneSlot3)
            break
        case 4:
            await TwitchService.enableCustomReward(config.customReward.immuneSlot4)
            break
        case 5:
            await TwitchService.enableCustomReward(config.customReward.immuneSlot5)
            break
    }
}


module.exports = {
    getImmunes,
    increaseBan,
    removeImmune,
    addImmune,
    checkExpiredImmunes
}
