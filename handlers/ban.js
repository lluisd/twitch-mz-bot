const config = require("../config")
const TwitchService = require('../services/twitch')
const StrikeService = require('../services/strike')
const moment = require('moment')
require('mathjs')
const {forEach} = require("mathjs");

class Ban {
    async getBansCountAndUnbanRequests(target, bot) {
        const result = await TwitchService.getUnbanRequests()
        const bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        if (result && bans) {
            const text = `${bans.length} bans.` + (result.length > 0 ? ` Hay ${result.length} solicitud/es de desbaneo pendientes de revisar (${this._getUserNames(result)})` : ' No hay solicitudes de desbaneo pendientes de revisar.')
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

    async unbanAll(target, bot) {
        let totalCount = 0
        let bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        if (bans) {
            bans = bans.filter(b => config.blacklistUsers.indexOf(b.userId) === -1)
            forEach(bans, async ban => {
                await this.unban(target, ban.userName)
            })
            totalCount += bans.length
        }
        const timeouts = await TwitchService.getTimeouts()
        if (timeouts) {
            forEach(timeouts, async timeout => {
                await this.unban(target, ban.userName)
            })
            totalCount += timeouts.length
        }
        const text = `¡Ojo, ${totalCount} usuarios desbaneados!`
        await bot.say(target, text)
    }

    async unbanRoulette(target, bot) {
        let bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        if (bans) {
            bans = bans.filter(b => config.blacklistUsers.indexOf(b.userId) === -1)
            if (bans.length > 0) {
                const randomBan = bans[Math.floor(Math.random() * bans.length)]
                await this.unban(target, randomBan.userName)
                const text = `Enhorabuena ${randomBan.userName}`
                await bot.say(target, text)
            }
        }
    }

    async timeoutRoulette(target, bot, nicks) {
        const users = await TwitchService.getCurrentUsers()
        let players = []
        nicks.forEach(nick => {
            const matchedUser = users.find(u => u.userDisplayName.toLowerCase() === nick.replace(/^@/, '').toLowerCase())
            if (matchedUser) {
                players.push(matchedUser)
            }
        })

        const chambers = 6
        let gun = Array(chambers).fill(false);
        gun[0] = true
        gun = gun.sort(() => Math.random() - 0.5)

        for (let i = 0; i < players.length; i++) {
            const shot = gun.pop()
            if (shot) {
                const text = `¡Pum! ${players[i].userDisplayName} se ha llevado un disparo.`
                await bot.say(target, text)
                await TwitchService.banUser(players[i].userId, 60)
                return;
            } else {
                await bot.say(target, `${players[i].userDisplayName} está a salvo.`)
            }
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
        await bot.say(target, "¡Todo el mundo esta a salvo!")
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

    async setStrike(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            const strikes = await StrikeService.getStrikes(user.id)
            const strikesCount = strikes ? strikes.number : 0
            await StrikeService.setStrike(user.id)
            if (strikesCount < 1) {
                await bot.say(target, `Strike ${strikesCount+ 1}/3 para ${user.display_name}, cuidadín, primer aviso!`)
            } else if (strikesCount < 2) {
                await bot.say(target, `Strike ${strikesCount+ 1}/3 para ${user.display_name}, me estas calentando, segundo aviso!`)
            } else {
                await TwitchService.banUser(user.id, 600)
                await bot.say(target, `Strike ${strikesCount + 1}/3 para ${user.display_name}, al carrer 10 minutos comemierda!`)
                await StrikeService.resetStrike(user.id)
            }
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
