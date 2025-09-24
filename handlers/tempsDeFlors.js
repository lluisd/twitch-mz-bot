const config = require("../config")
const TempsDeFlorsService = require('../services/tempsDeFlors')
const TwitchService = require('../services/twitch')
const BrowserService = require("../services/browser")
const ScreenshotService = require("../services/screenshot")
const {photoSemaphore} = require("../semaphore")
const logger = require('../lib/logger')

class TempsDeFlors {
    async getSpot (target, text, bot, roomId) {
        const spotNumber = parseInt(text)
        if (!isNaN(spotNumber)) {
            const spot = await TempsDeFlorsService.getTFSpot(roomId, spotNumber)
            if (spot) {
                await this._printSpot(spot, target, bot)
            }
        }
    }

    async getMapLink (target, bot) {
        await bot.say(target, `Mapa de puntos https://tempsdeflors.girona.cat/docs/planol-tempsdeflors2024.pdf`)
    }

    async getCommands (target, bot) {
        await bot.say(target, `${config.externalUrl}/comandos`)
    }

    async getNotification (bot, target) {
        const spots = await TempsDeFlorsService.getTFSpots(config.twitch.roomId)
        const count = spots.filter((s) => s.visited).length
        await bot.say(target, `¡Empezó el reto de temps de Flors! ${config.externalUrl}/reto (${count}/${spots.length} completado) Comandos: !puntos, !punto 2`)
    }

    async getTotalSpot (target, bot, roomId) {
        const spots = await TempsDeFlorsService.getTFSpots(roomId)
        const count = spots.filter((s) => s.visited).length
        await bot.say(target, `Puntos: ${config.externalUrl}/reto (${count}/${spots.length} vistos)`)
    }

    async setVisited (target, text, bot, roomId) {
        const spotNumber = parseInt(text)
        if (!isNaN(spotNumber)) {
            const spot = await TempsDeFlorsService.setTFVisited(roomId, spotNumber)
            //await TwitchService.setActiveSpot(0)
            if (spot) {
                await this._printSpot(spot, target, bot)
            }
        }
    }

    async delete (target, text, bot, roomId) {
        const spotNumber = parseInt(text)
        if (!isNaN(spotNumber)) {
            const spot = await TempsDeFlorsService.deleteTF(roomId, spotNumber)
            if (spot) {
                await this._printSpot(spot, target, bot)
            }
        }
    }

    async setActive (target, text, bot, roomId) {
        const spotNumber = parseInt(text)
        if (!isNaN(spotNumber)) {
            const spot = await TempsDeFlorsService.setTFVisited(roomId, spotNumber, true)
            if (spot) {
                await TwitchService.setActiveSpot(spotNumber)
                await bot.say(target, `Punto: ${this._getText(spot)} activo para !foto`)
            }
        }
    }

    async setDeactivate (target, bot) {
        const channelBeforeUpdate = await TwitchService.setActiveSpot(0)
        if (channelBeforeUpdate?.activeSpot && channelBeforeUpdate.activeSpot !== 0) {
            await bot.say(target, `Punto ${channelBeforeUpdate.activeSpot} desactivado.`)
        }
    }

    async getActive (target, bot, roomId) {
        const channel = await TwitchService.getChannel()
        if (channel.activeSpot !== 0) {
            const spot = await TempsDeFlorsService.getTFSpot(roomId, channel.activeSpot)
            if (spot) {
                await bot.say(target, `Punto: ${this._getText(spot)} activo para !foto`)
            }
        } else {
            await bot.say(target, `No hay ningún punto activo para !foto`)
        }
    }

    async hasActiveSpot () {
        const channel = await TwitchService.getChannel()
        return channel.activeSpot !== 0
    }

    async captureScreenshot(target, text, bot, displayName, roomId) {
        if (photoSemaphore.isLocked()) {
            return
        }
        const [value, release] = await photoSemaphore.acquire()
        try {
            const channel = await TwitchService.getChannel()
            const spot = await TempsDeFlorsService.getTFSpot(roomId, channel.activeSpot)
            if (spot){
                await TwitchService.setActiveSpot(0)
                await this._getScreenshot(target, bot, displayName, roomId, spot, channel)
            }
        } finally {
            release()
        }
    }

    async _getScreenshot(target, bot, displayName, roomId, spot, channel) {
        const image = await BrowserService.getScreenshot().catch(() => { logger.error('getScreenshot on captureScreenshot')})
        if (image) {
            spot = await TempsDeFlorsService.setTFScreenshot(roomId, spot.number, image.fileName, displayName)
            await bot.say(target, `Captura de punto ${this._getText(spot)}, punto desactivado.`)
            await ScreenshotService.addScreenshot(image.fileName, channel.streamId, displayName, roomId)
            await BrowserService.refreshPage()
        }
    }

    async _printSpot(spot, target, bot) {
        if (spot !== null) {
            await bot.say(target, this._getText(spot))
        }
    }

    _getText(spot) {
        const timetable = spot.timetable ? '*Interior Abierto Miércoles 15 y Sábados 11 y 18, de 9.30-24 h' : ''
        let text = `${spot.number} - ${spot.description}`
        if (spot.visited) {
            text = `${text} (✔️ ${this._getScreenshotText(spot)} )`
        } else {
            text = `${text} (❌${this._getScreenshotText(spot)} ) (maps ${config.externalUrl}/p/${spot.number} )`
        }
        return text
    }

    _getScreenshotText(spot){
        let text = ''
        if (spot.screenshot) {
            text = ` ${config.externalUrl}/t/${spot.screenshot}`
        }
        return text
    }
}


module.exports = TempsDeFlors
