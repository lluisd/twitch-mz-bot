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
            await TwitchService.banUser(user.id, duration)
        }
    }

    async unban(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.unBanUser(user.id)
        }
    }

    _getUserNames (unbanRequests) {
        let text
        if (unbanRequests.length === 1){
            text = this._maskUserName(unbanRequests[0].user_name)
        } else if (unbanRequests.length > 1) {
            text = unbanRequests.map(ur => this._maskUserName(ur.user_name)).join(', ').replace(/, ([^,]*)$/, ' y $1')
        }
        return text
    }

    _maskUserName (userName) {
        const unmaskedStartLength = 3
        const unmaskedEndLength = 1

        let unmaskedStart = userName.substring(0, unmaskedStartLength)
        let masked = ''
        let unmaskedEnd = ''

        const unmaskedLength = unmaskedStartLength + unmaskedEndLength
        if (userName.length > unmaskedLength) {
            masked = '*'.repeat(userName.length - unmaskedLength)
            unmaskedEnd = userName.substring(userName.length - unmaskedEndLength)
        } else if (userName.length > unmaskedStartLength) {
            masked = '*'.repeat(userName.length - unmaskedStartLength)
        }

        return unmaskedStart + masked + unmaskedEnd
    }
}


module.exports = Ban
