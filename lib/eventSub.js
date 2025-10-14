const {EventSubMiddleware} = require("@twurple/eventsub-http");
const config = require("../config");
const broadcasterApiClient = require('../broadcasterApiClient')
const TwitchService = require("../services/twitch");
const ImmuneService = require("../services/immune");
const WhisperService = require("../services/whisper");
const logger = require('../lib/logger')
const moment = require("moment-timezone");

class EventSub {
    constructor() {}

    async init (twitchBot, telegramBot) {
        const apiClient = await broadcasterApiClient.getApiClient()
        this.twitchBot = twitchBot
        this.telegramBot = telegramBot
        this.middleware = new EventSubMiddleware({
            apiClient,
            hostName: config.twitch.hostname,
            pathPrefix: '/twitch',
            secret: config.twitch.eventSubSecret,
            strictHostCheck: false,
            logger: {
                minLevel: 'info',
                emoji: false,
                colors: false
            }
        })
        this.cooldown = {
            followers: false,
            ban: false
        }
    }

    apply (app) {
        this.middleware.apply(app)
    }

    async markAsReady () {
        await this.middleware.markAsReady()
    }

    async immuneSlotRedemptionHandler (slotNumber, event) {
        try {
            logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
            const channel = await TwitchService.getChannel()
            const immunes = await ImmuneService.getImmunes()
            const immune = immunes.find(i => i.userId === parseInt(event.userId))
            if (channel && channel.whitelistUsers.includes(parseInt(event.userId))) {
                logger.info(`User ${event.userDisplayName} is whitelisted, ignoring redemption...`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ya eres un usuario de confianza, no puedes canjear el inmune!`)
                await event.updateStatus('CANCELED')
            } else if (immune) {
                logger.info(`User ${event.userDisplayName} is whitelisted, ignoring redemption...`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ya eres un usuario de confianza, no puedes canjear el inmune!`)
                await event.updateStatus('CANCELED')
            } else {
                await TwitchService.disableCustomReward(event.rewardId)
                await ImmuneService.addImmune(event.userId, slotNumber)
                logger.info(`Set ${event.userDisplayName} as immune slot ${slotNumber}`)
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} es el inmune en el Slot ${slotNumber}, es inbaneable por 24 horas o hasta el 3r ban!`)
                await event.updateStatus('FULFILLED')
            }
        } catch (err) {
            logger.error(`Error processing immuneSlot${slotNumber} redemption: ${err.message}`)
        }
    }

    async subscribeEvent (channelId) {
        this.middleware.onChannelFollow(channelId, config.twitch.roomId, async event => {
            try {
                logger.info(`${event.userDisplayName} just followed ${event.broadcasterDisplayName}!`);
                const channel = await TwitchService.getChannel()
                if (channel.notifyChannelFollowMessage && this._isNotCooldown('followers', 1)) {
                    await this.twitchBot.say(`#${config.twitch.channels}`, `Bienvenido a la masonería @${event.userDisplayName}!`)
                }
            } catch (error) {
                logger.error('Error en el handler de channel.follow:', error)
            }
        })

        const rewards = await TwitchService.getCustomRewards()

        this.middleware.onChannelRedemptionAdd(channelId, async event => {
            try {
                logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
            } catch (err) {
                logger.error(`Error detecting redemption: ${err.message}`)
            }
        })

        const immuneSlotsRewards = [
            { id: config.customReward.immuneSlot1, handler: event => this.immuneSlotRedemptionHandler(1, event)},
            { id: config.customReward.immuneSlot2, handler: event => this.immuneSlotRedemptionHandler(2, event)},
            { id: config.customReward.immuneSlot3, handler: event => this.immuneSlotRedemptionHandler(3, event)},
            { id: config.customReward.immuneSlot4, handler: event => this.immuneSlotRedemptionHandler(4, event)},
            { id: config.customReward.immuneSlot5, handler: event => this.immuneSlotRedemptionHandler(5, event)}
        ]

        immuneSlotsRewards.forEach((reward, index) => {
            const rewardExists = rewards.some(r => r.id === reward.id);
            if (!rewardExists) {
                logger.warn(`El rewardId immuneSlot${index + 1} ${reward.id} no existe, se omite la suscripción.`);
                return
            }

            this.middleware.onChannelRedemptionAddForReward(channelId, reward.id, reward.handler);
        })

        const setTitleRewardExists = rewards.some(r => r.id === config.customReward.setTitle)
        if (!setTitleRewardExists) {
            logger.warn('El rewardId setTitle ' + config.customReward.setTitle + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.setTitle, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    await TwitchService.setTitle(event.input)
                    await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha comprado el cambio de título: ${event.input}`)
                    await event.updateStatus('FULFILLED')
                } catch (err) {
                    logger.error(`Error processing setTitle redemption: ${err.message}`)
                }
            })
        }

        const buyVipRewardExists = rewards.some(r => r.id === config.customReward.buyVip)
        if (!buyVipRewardExists) {
            logger.warn('El rewardId buyVip ' + config.customReward.buyVip + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.buyVip, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    const isAlreadyVip = await TwitchService.isVip(event.userId)
                    if (!isAlreadyVip) {
                        await TwitchService.addVip(event.userId)
                        logger.info(`Added VIP to ${event.userDisplayName}`)
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha comprado el VIP`)
                        await event.updateStatus('FULFILLED')
                    } else {
                        logger.info(`${event.userDisplayName} is already a VIP`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ya eres VIP de la masonería cabeza de chorlito!`)
                    }
                } catch (err) {
                    logger.error(`Error processing buyVip redemption: ${err.message}`)
                }
            })
        }

        const revokeVipRewardExists = rewards.some(r => r.id === config.customReward.revokeVip)
        if (!revokeVipRewardExists) {
            logger.warn('El rewardId revokeVip ' + config.customReward.revokeVip + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.revokeVip, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    if (event.input && event.input.length > 1) {
                        const targetNick = event.input.replace(/^@/, '').toLowerCase()
                        const targetUser = await TwitchService.getUser(targetNick)
                        if (!targetUser) {
                            logger.info(`${targetNick} is not a valid user`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} revocado fallido, @${targetNick} no es un usuario conocido!`)
                            return
                        }
                        const targetUserIsVip = await TwitchService.isVip(targetUser.id)
                        if (!targetUserIsVip) {
                            logger.info(`${targetUser.displayName} is not a VIP`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} revocado fallido, @${targetUser.displayName} no es VIP!`)
                            return
                        }
                        await TwitchService.removeVip(targetUser.id)
                        logger.info(`Revoked VIP from ${targetUser.displayName}`)
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha revocado el VIP de @${targetUser.displayName}`)
                        await event.updateStatus('FULFILLED')
                    } else {
                        logger.info(`${event.input} no es valido para canjeo`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} revocado fallido, @${event.input} no es un nick conocido!`)
                    }
                } catch (err) {
                    logger.error(`Error processing revokeVip redemption: ${err.message}`)
                }
            })
        }

        const stealVipRewardExists = rewards.some(r => r.id === config.customReward.stealVip)
        if (!stealVipRewardExists) {
            logger.warn('El rewardId stealVip ' + config.customReward.stealVip + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.stealVip, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    const isAlreadyVip = await TwitchService.isVip(event.userId)
                    if (isAlreadyVip) {
                        logger.info(`${event.userDisplayName} is already VIP`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ya eres VIP de la masonería cabeza de chorlito!`)
                        return
                    }
                    if (event.input && event.input.length > 1) {
                        const targetNick = event.input.replace(/^@/, '').toLowerCase()
                        const targetUser = await TwitchService.getUser(targetNick)
                        if (!targetUser) {
                            logger.info(`${targetNick} is not a valid user`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} robo fallido, @${targetNick} no es un usuario conocido!`)
                            return
                        }
                        const targetUserIsVip = await TwitchService.isVip(targetUser.id)
                        if (!targetUserIsVip) {
                            logger.info(`${targetUser.displayName} is not a VIP`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} robo fallido, @${targetUser.displayName} no es VIP!`)
                            return
                        }
                        await TwitchService.removeVip(targetUser.id)
                        await TwitchService.addVip(event.userId)
                        logger.info(`Added VIP to ${event.userDisplayName} by stealing from ${targetUser.displayName}`)
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha robado el VIP de @${targetUser.displayName}`)
                        await event.updateStatus('FULFILLED')
                    } else {
                        logger.info(`${event.input} no es valido para canjeo`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} robo fallido, @${event.input} no es un nick conocido!`)
                    }
                } catch (err) {
                    logger.error(`Error processing stealVip redemption: ${err.message}`)
                }
            })
        }

        const unbanRewardExists = rewards.some(r => r.id === config.customReward.unban)
        if (!unbanRewardExists) {
            logger.warn('El rewardId unban ' + config.customReward.unban + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.unban, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    if (event.input && event.input.length > 1) {
                        const targetNick = event.input.replace(/^@/, '').toLowerCase()
                        const targetUser = await TwitchService.getUser(targetNick)
                        if (!targetUser) {
                            logger.info(`${targetNick} is not a valid user`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} unban fallido, @${targetNick} no es un usuario conocido!`)
                            return
                        }
                        let bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
                        bans = bans.filter(ban => config.blacklistUsers.indexOf(ban.userId.toString()) === -1)
                        const isBanned = bans.find(ban => parseInt(ban.userId) === parseInt(targetUser.id))
                        const blockedUsers = await TwitchService.getBlockedUsers()
                        const isBlocked = blockedUsers.find(blocked => parseInt(blocked.userId) === parseInt(targetUser.id))
                        if (!isBanned && !isBlocked) {
                            logger.info(`${targetUser.displayName} is not banned or blocked`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} unban fallido, @${targetUser.displayName} no está ban!`)
                            return
                        }
                        await TwitchService.unban(targetUser.id)
                        await TwitchService.unBlockUser(targetUser.id)
                        await TwitchService.updateBlockedUsers()
                        logger.info(`user ${event.userDisplayName} unbanned and unblocked ${targetUser.displayName}`)
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha desbaneado a @${targetUser.displayName}`)
                        await event.updateStatus('FULFILLED')
                    } else {
                        logger.info(`${event.input} no es valido para canjeo`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} unban fallido, @${event.input} no es un nick conocido!`)
                    }
                } catch (err) {
                    logger.error(`Error processing unban redemption: ${err.message}`)
                }
            })
        }

        const timeoutRewardExists = rewards.some(r => r.id === config.customReward.timeout)
        if (!timeoutRewardExists) {
            logger.warn('El rewardId timeout ' + config.customReward.timeout + ' no existe. La suscripción no se creará.')
        } else {
            this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.timeout, async event => {
                try {
                    logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}! con {event.rewardId: ${event.rewardId} y event.id: ${event.id}}`)
                    const users = await TwitchService.getCurrentUsers()
                    if (event.input && event.input.length > 1) {
                        const targetNick = event.input.replace(/^@/, '').trim().toLowerCase()
                        const targetUser = await TwitchService.getUser(targetNick)
                        if (!targetUser) {
                            logger.info(`${targetNick} is not a valid user`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} timeout a @${targetNick} fallido, no existe!`)
                            return
                        }
                        const matchedUser = users.find(u => u.userId === targetUser.id)
                        if (!matchedUser) {
                            logger.info(`${targetNick} is not a valid user`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} timeout a @${targetNick} fallido, no está en el stream!`)
                            return
                        }
                        const targetUserIsMod = await TwitchService.isMod(targetUser.id)
                        if (targetUserIsMod) {
                            logger.info(`${targetUser.displayName} is a MOD, cannot timeout`)
                            await event.updateStatus('CANCELED')
                            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} timeout a @${targetUser.displayName} fallido, es un MOD!`)
                            return
                        }
                        await TwitchService.ban(targetUser.id, 120)
                        logger.info(`Timeout to ${targetUser.displayName} from ${event.userDisplayName}`)
                        await event.updateStatus('FULFILLED')
                    } else {
                        logger.info(`${event.input} no es valido para canjeo`)
                        await event.updateStatus('CANCELED')
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} timeout fallido, @${event.input} no es un nick conocido!`)
                    }
                } catch (err) {
                    logger.error(`Error processing timeout redemption: ${err.message}`)
                }
            })
        }

        this.middleware.onChannelSubscription(channelId, async event => {
            try {
                logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
                if (!event.isGift) {
                    await this.twitchBot.say(`#${config.twitch.channels}`, `Tenemos nueva sub @${event.userDisplayName} masónica!`)
                }
            } catch (error) {
                logger.error('Error en el handler de channel.subscription:', error)
            }
        })

        this.middleware.onChannelSubscriptionGift(channelId, async event => {
            try {
                logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.gifterDisplayName} ha regalado ${event.amount} subs!`)
            } catch (error) {
                logger.error('Error en el handler de channel.subscription.gift:', error)
            }
        })

        this.middleware.onChannelRaidTo(channelId, async event => {
            try {
                logger.debug(`${event.raidingBroadcasterDisplayName} raided to the channel with ${event.viewers} viewers!`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `Raid con ${event.viewers} viewers de @${event.raidingBroadcasterDisplayName}!`)
            } catch (error) {
                logger.error('Error en el handler de channel.raid.to:', error)
            }

        })

        this.middleware.onChannelRaidFrom(channelId, async event => {
            try {
                logger.debug(`${event.raidedBroadcasterDisplayName} raiding with ${event.viewers} viewers!`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `Raid de odio a @${event.raidedBroadcasterDisplayName}!`)
            } catch (error) {
                logger.error('Error en el handler de channel.raid.from:', error)
            }
        })

        this.middleware.onChannelBan(channelId, async event => {
            try {
                logger.debug(`${event.moderatorDisplayName} banned ${event.userDisplayName}!`);
                if (event.moderatorId !== "402337290") {
                    const channel = await TwitchService.getChannel()
                    if (channel && channel.whitelistUsers.includes(parseInt(event.userId)) && channel.immunity) {
                        logger.info(`User ${event.userDisplayName} is whitelisted, unbanning...`);
                        await TwitchService.unban(event.userId)
                        await TwitchService.unBlockUser(event.userId)
                        await TwitchService.updateBlockedUsers()
                        return
                    }
                    const immunes = await ImmuneService.getImmunes()
                    const immune = immunes.find(u => u.userId === parseInt(event.userId))
                    if (immune) {
                        immune.bans = immune.bans + 1
                        await ImmuneService.increaseBan(immune.userId)
                    }
                    if (channel && channel.immunity && immune && immune.bans < 3) {
                        logger.info(`User ${event.userDisplayName} is immune of an slot, unbanning...`);
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} es el inmune 24h! strike ${immune.bans} de 3`)
                        await TwitchService.unban(event.userId)
                        await TwitchService.unBlockUser(event.userId)
                        return
                    }
                    if (channel && immune && immune.bans > 2) {
                        logger.info(`User ${event.userDisplayName} is immune of an slot but with 3 ban strikes, banning permanently...`);
                        await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ha perdido la immunidad! strike ${immune.bans} de 3`)
                        await ImmuneService.removeImmune(event.userId)
                        return
                    }
                    if (event.isPermanent) {
                        const message = `🔨 @${event.userDisplayName} ha mordido el polvo!`;
                        if (this._isNotCooldown('ban', 1)) {
                            await this.twitchBot.say(`#${config.twitch.channels}`, message)
                            await this.telegramBot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' })
                        }
                    } else {
                        if (this._isNotCooldown('ban', 1)) {
                            await this.twitchBot.say(`#${config.twitch.channels}`, `⌚ Timeout para que @${event.userDisplayName} se calme!`)
                        }
                    }
                }
                await TwitchService.addBan(channelId, event.userId, event.userName, event.moderatorName, event.reason, event.startDate, event.endDate)
            } catch (error) {
                logger.error('Error en el handler de channel.ban:', error)
            }
        })

        this.middleware.onChannelUnban(channelId, async event => {
           try {
               //await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} desbaneado`)
               await TwitchService.removeBan(channelId, event.userId)
           } catch (error) {
                logger.error('Error en el handler de channel.ban:', error)
           }
        })

        this.middleware.onChannelPollBegin(channelId, async event => {
            try {
                logger.debug(`Poll ${event.title} has started!`);
                await this.twitchBot.say(`#${config.twitch.channels}`, `Encuesta iniciada: ${event.title}, vota!`)
            } catch (error) {
                logger.error('Error en el handler de channel.poll.begin:', error)
            }
        })

        this.middleware.onChannelVipAdd(channelId, async event => {
            try {
                logger.debug(`User ${event.userDisplayName} has been added as VIP!`);
                await TwitchService.addVipHandler(channelId, event.userId, event.userName)
                await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} es ahora un mansón del canal! FBtouchdown FBtouchdown FBtouchdown FBtouchdown`)
            } catch (error) {
                logger.error('Error en el handler de channel.vip.add:', error)
            }
        })

        this.middleware.onChannelVipRemove(channelId, async event => {
            try {
                logger.debug(`User ${event.userDisplayName} has been removed as VIP!`);
                await TwitchService.removeVipHandler(channelId, event.userId)
                await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ya no forma parte de la masonería del canal!`)
            } catch (error) {
                logger.error('Error en el handler de channel.vip.remove:', error)
            }
        })

        this.middleware.onChannelModeratorAdd(channelId, async event => {
            try {
                logger.debug(`User ${event.userDisplayName} has been added as moderator!`);
                await TwitchService.addModHandler(channelId, event.userId, event.userName)
                await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ha ascendido al alto rango de la masonería!`)
            } catch (error) {
                logger.error('Error en el handler de channel.moderator.add:', error)
            }
        })

        this.middleware.onChannelModeratorRemove(channelId, async event => {
            try {
                logger.debug(`User ${event.userDisplayName} has been removed as moderator!`);
                await TwitchService.removeModHandler(channelId, event.userId)
                await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ha degradado del alto rango de la masonería!`)
            } catch (error) {
                logger.error('Error en el handler de channel.moderator.remove:', error)
            }
        })

        this.middleware.onStreamOnline(channelId, async event => {
            try {
                logger.debug(`Stream ${event.broadcasterDisplayName} has started!`);
                await WhisperService.start()
                await this.twitchBot.say(`#${config.twitch.channels}`, `Gente, estamos Online`)
            } catch (error) {
                logger.error('Error en el handler de stream.online:', error)
            }
        })

        this.middleware.onStreamOffline(channelId, async event => {
            try {
                logger.debug(`Stream ${event.broadcasterDisplayName} has ended!`);
                await WhisperService.stop()
                await this.twitchBot.say(`#${config.twitch.channels}`, `Luego abro, Offline`)
            } catch (error) {
                logger.error('Error en el handler de stream.offline:', error)
            }
        })
    }

    _isNotCooldown (property, seconds = 3, extraProperty) {
        if (!this.cooldown[property]) {
            this.cooldown[property] = true
            if (this.cooldown[extraProperty]) this.cooldown[extraProperty] = true
            setTimeout(() => {
                this.cooldown[property] = false
                if (this.cooldown[extraProperty]) this.cooldown[extraProperty] = false
            }, seconds * 1000)
            return true;
        }
        return false;
    }
}

module.exports = EventSub

