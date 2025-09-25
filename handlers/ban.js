const config = require("../config")
const TwitchService = require('../services/twitch')
const ImmuneService = require('../services/immune')
const StrikeService = require('../services/strike')
const moment = require('moment')
require('mathjs')
const logger = require('../lib/logger')

class Ban {
    async getBansCountAndUnbanRequests(target, bot) {
        const unbanRequests = await TwitchService.getUnbanRequests()
        let bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        bans = bans.filter(ban => config.blacklistUsers.indexOf(ban.userId.toString()) === -1)

        if (unbanRequests && bans) {
            const count = Math.min(bans.length, 5)
            const unbanRequestsText = unbanRequests.length > 0 ?
                ` Hay ${unbanRequests.length} solicitud/es de desbaneo pendientes de revisar (${this._getUserNames(unbanRequests)}).` :
                ''
            let text = bans.length > 0 ?
                `${bans.length} bans. Último/s ${count} bans: ${this._getUserNames(bans.slice(0,count))}.` :
                '' + unbanRequestsText
            text = text + ` Detalles en ${config.externalUrl}/bans`
            await bot.say(target, text)
        }
    }

    async ban(target, username, bot, duration) {
        const user = await TwitchService.getUser(username)

        let durationNumber = parseInt(duration)
        if (isNaN(durationNumber)) {
            durationNumber = null
        }

        if (user) {
            await TwitchService.ban(user.id, duration)
        }
    }

    async unban(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.unban(user.id)
            await TwitchService.unBlockUser(user.id)
            await TwitchService.updateBlockedUsers()
        }
    }

    async unBlock(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.unBlockUser(user.id)
            await TwitchService.updateBlockedUsers()
        }
    }

    async block(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.blockUser(user.id)
            await TwitchService.updateBlockedUsers()
        }
    }

    async addUserToChannelWhitelist(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.addUserIdToChannelWhitelist(user.id)
        }
    }

    async removeUserFromChannelWhitelist(target, username, bot) {
        const user = await TwitchService.getUser(username)
        if (user) {
            await TwitchService.removeUserIdFromChannelWhitelist(user.id)
        }
    }

    async unbanExpiredTimeouts() {
        const timeouts = await TwitchService.getTimeouts()
        if (timeouts) {
            for (const timeout of timeouts) {
                if (moment().isAfter(moment(timeout.expiryDate))) {
                    await TwitchService.removeBan(config.twitch.roomId, timeout.userId)
                }
            }
        }
    }

    async unbanAll(target, bot) {
        let nicks = ""
        const bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        const timeouts = await TwitchService.getTimeouts()
        let bansList = []
        if (bans) {
            bansList = bansList.concat(bans)
        }
        if (timeouts) {
            bansList = bansList.concat(timeouts)
        }

        let unbansList = []
        for (let ban of bansList) {
            if (config.blacklistUsers.indexOf(ban.userId.toString()) === -1 && !unbansList.includes(b => b.userName === ban.userName)) {
                await TwitchService.unban(ban.userId)
                await TwitchService.unBlockUser(ban.userId)
                unbansList.push(ban)
            }
        }
        await TwitchService.updateBlockedUsers()
        const bansCount = Math.min(unbansList.length, 20)
        nicks += this._getUserNames(unbansList.slice(0,bansCount))

        const text =  bansCount > 0 ? `¡Ojo, ${unbansList.length} desbaneados! 🎉 ${nicks} 🎉 ¡A disfrutar!` : 'No hay nadie que desbanear. 🎉'
        await bot.say(target, text)
    }

    async unbanRoulette(target, bot) {
        let bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
        if (bans) {
            bans = bans.filter(b => config.blacklistUsers.indexOf(b.userId.toString()) === -1)
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
                await TwitchService.ban(players[i].userId, 60)
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
           logger.error(e +'getBannedUsers on getBannedUsers')}
       )
       if (bansList && bansList.length > 0) {
           const text = `Actualizados ${bansList.length} bans`
           logger.info(text)
           await bot.say(target, text)
       }
    }

    async updateVipsList(target, bot) {
        const vipsList = await TwitchService.updateVips().catch((e) => {
            logger.error(e +' on updateVipsList')}
        )
        if (vipsList && vipsList.length > 0) {
            const text = `Actualizados ${vipsList.length} vips`
            logger.info(text)
            await bot.say(target, text)
        }
    }

    async updateModsList(target, bot) {
        const modsList = await TwitchService.updateMods().catch((e) => {
            logger.error(e +' on updateModsList')}
        )
        if (modsList && modsList.length > 0) {
            const text = `Actualizados ${modsList.length} mods`
            logger.info(text)
            await bot.say(target, text)
        }
    }

    async updateBlocksList(target, bot) {
        const blocksList = await TwitchService.updateBlockedUsers().catch((e) => {
            logger.error(e +'updateBlockedUsers on updateBlocksList')}
        )
        if (blocksList && blocksList.length > 0) {
            const text = `Actualizados ${blocksList.length} bloqueos`
            logger.info(text)
        }
    }

    async getTimeouts(target, bot) {
        const timeouts = await TwitchService.getTimeouts()
        if (timeouts) {
            const count = Math.min(timeouts.length, 5)
            let text = timeouts.length > 0 ? `Último/s ${count} timeouts: ${this._getUserNames(timeouts.slice(0,count))}` : 'Ho hay timeouts.'
            text = text + ` Detalles en ${config.externalUrl}/timeouts`
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
                await bot.say(target, `Strike ${strikesCount+ 1}/3 para ${user.displayName}, cuidadín, primer aviso!`)
            } else if (strikesCount < 2) {
                await bot.say(target, `Strike ${strikesCount+ 1}/3 para ${user.displayName}, me estas calentando, segundo aviso!`)
            } else {
                await TwitchService.ban(user.id, 600)
                await bot.say(target, `Strike ${strikesCount + 1}/3 para ${user.displayName}, al carrer 10 minutos comemierda!`)
                await StrikeService.resetStrike(user.id)
            }
        }
    }

    async checkExpiredImmunes(target, twitchBot) {
        const immunes = await ImmuneService.getImmunes()
        for (const immune of immunes) {
            if (immune.expiryDate && moment().isAfter(immune.expiryDate)) {
                await ImmuneService.removeImmune(immune.userId)
                const user = await TwitchService.getUserById(immune.userId)
                await twitchBot.say(target, `${user.displayName} ya no es inmune. Slot ${immune.slot} libre.`)
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
        const unmaskedEndLength = 3

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
