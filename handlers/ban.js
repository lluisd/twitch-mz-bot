const config = require("../config")
const TwitchService = require('../services/twitch')

class Ban {
    async getUnbanRequests(target, bot) {
        const result = await TwitchService.getUnbanRequests()
        if (result !== null) {
            const text = result.length > 0 ? `Hay ${result.length} solicitudes de desbaneo pendientes de revisar (${this._getUserNames(result)})` : 'No hay solicitudes de desbaneo pendientes de revisar.'
            await bot.say(target, text)
        }
    }

    async ban(target, username, bot, duration) {
        const user = await TwitchService.getUser(username)

        let durationNumber = parseInt(duration)
        if (typeof durationNumber !== 'number') {
            durationNumber = null
        }

        if (user) {
            const result = await TwitchService.banUser(user.id, duration)
        }
    }

    async unban(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            const result = await TwitchService.unBanUser(user.id)
        }
    }
}


module.exports = Ban
