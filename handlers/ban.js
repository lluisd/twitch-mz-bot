const config = require("../config")
const TwitchService = require('../services/twitch')
const moment = require('moment')
require('mathjs')

class Ban {
    async getUnbanRequests(target, bot) {
        const result = await TwitchService.getUnbanRequests()
        if (result !== null) {
            const text = result.length > 0 ? `Hay ${result.length} solicitud/es de desbaneo pendientes de revisar (${this._getUserNames(result)})` : 'No hay solicitudes de desbaneo pendientes de revisar.'
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

    async updateBansList(target, bot) {
       const bansList = await TwitchService.updateBannedUsers().catch((e) => {
           console.error(e +'getBannedUsers on getBannedUsers')}
       )
       if (bansList && bansList.length > 0) {
           const text = `Actualizados ${bansList.length} bans`
           await bot.say(target, text)
       }
    }

    async getTimeouts(target, bot) {
        const timeouts = await TwitchService.getTimeouts()
        if (timeouts) {
            const count = Math.min(timeouts.length, 5)
            const text = timeouts.length > 0 ? `Último/s ${count} timeouts: ${this._getUserNames(timeouts.slice(0,count))}` : 'Ho hay timeouts.'
            await bot.say(target, text)
        }
    }

    async getTimeoutsCount(target, bot) {
        const timeouts = await TwitchService.getTimeouts()
        if (timeouts) {
            const text = `${timeouts.length} timeouts total`
            await bot.say(target, text)
        }
    }

    async getTodayBansCount(target, bot) {
        const bans = await TwitchService.getBannedUsersCountByDate(moment().startOf('day').toDate())
        if (bans) {
            const text = `${bans.length} bans hoy`
            await bot.say(target, text)
        }
    }

    async getWeeklyBansCount(target, bot) {
        const bans = await TwitchService.getBannedUsersCountByDate(moment().startOf('week').toDate())
        if (bans) {
            const text = `${bans.length} bans esta semana`
            await bot.say(target, text)
        }
    }

    async getMonthlyBansCount(target, bot) {
        const bans = await TwitchService.getBannedUsersCountByDate(moment().startOf('month').toDate())
        if (bans) {
            const text = `${bans.length} bans este mes`
            await bot.say(target, text)
        }
    }

    async getYearlyBansCount(target, bot) {
        const bans = await TwitchService.getBannedUsersCountByDate(moment().startOf('year').toDate())
        if (bans) {
            const text = `${bans.length} bans este año`
            await bot.say(target, text)
        }
    }

    async getTotalBansCount(target, bot) {
        const bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        if (bans) {
            const text = `${bans.length} bans totales`
            await bot.say(target, text)
        }
    }

    _getUserNames (unbanRequests) {
        let text
        if (unbanRequests.length === 1){
            text = this._maskUserName(unbanRequests[0].user_name || unbanRequests[0].userName)
        } else if (unbanRequests.length > 1) {
            text = unbanRequests.map(ur => this._maskUserName(ur.user_name || ur.userName)).join(', ').replace(/, ([^,]*)$/, ' y $1')
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
