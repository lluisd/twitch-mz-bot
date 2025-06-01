const {EventSubMiddleware} = require("@twurple/eventsub-http");
const config = require("../config");
const broadcasterApiClient = require('../broadcasterApiClient')
const TwitchService = require("../services/twitch");
const WhisperService = require("../services/whisper");
const logger = require('../lib/logger')

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
            strictHostCheck: false
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

    async subscribeEvent (channelId) {

        this.middleware.onChannelFollow(channelId, config.twitch.userId, async event => {
            logger.info(`${event.userDisplayName} just followed ${event.broadcasterDisplayName}!`);
            const channel = await TwitchService.getChannel()
            if (channel.notifyChannelFollowMessage && this._isNotCooldown('followers', 1)) {
                await this.twitchBot.say(`#${config.twitch.channels}`, `Bienvenido a la masonería @${event.userDisplayName}!`)
            }
        })

        this.middleware.onChannelRedemptionAddForReward(channelId, config.customReward.vip, async event => {
            logger.info(`${event.userDisplayName} ha canjeado ${event.rewardTitle}!`)
            const isAlreadyVip = await TwitchService.isVip(event.userId)
            if (!isAlreadyVip) {
                await TwitchService.addVip(event.userId)
                logger.info(`Added VIP to ${event.userDisplayName}`)
            } else {
                logger.info(`${event.userDisplayName} is already a VIP`)
                await TwitchService.cancelRedeemption(event.rewardId, event.id)
                await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} ya eres VIP de la masonería cabeza de chorlito!`)
            }
        })

        this.middleware.onChannelSubscription(channelId, async event => {
            logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            if (!event.isGift) {
                await this.twitchBot.say(`#${config.twitch.channels}`, `Tenemos nueva sub @${event.userDisplayName} masónica!`)
            }
        })

        this.middleware.onChannelSubscriptionGift(channelId, async event => {
            logger.info(`${event.userDisplayName} just subscribed to ${event.broadcasterDisplayName}!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.gifterDisplayName} ha regalado ${event.amount} subs!`)
        })

        this.middleware.onChannelRaidTo(channelId, async event => {
            logger.debug(`${event.raidingBroadcasterDisplayName} raided to the channel with ${event.viewers} viewers!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Raid con ${event.viewers} viewers de @${event.raidingBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelRaidFrom(channelId, async event => {
            logger.debug(`${event.raidedBroadcasterDisplayName} raiding with ${event.viewers} viewers!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Raid de odio a @${event.raidedBroadcasterDisplayName}!`)
        })

        this.middleware.onChannelBan(channelId, async event => {
            logger.debug(`${event.moderatorDisplayName} banned ${event.userDisplayName}!`);
            if (event.moderatorId !== "402337290") {
                if (config.whitelistUsers.includes(event.userId.toString())) {
                    logger.info(`User ${event.userDisplayName} is whitelisted, unbanning...`);
                    await TwitchService.unban(event.userId)
                    await TwitchService.unBlockUser(event.userId)
                    await TwitchService.updateBlockedUsers()
                }
                else if (event.isPermanent) {
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
        })

        this.middleware.onChannelUnban(channelId, async event => {
            //await this.twitchBot.say(`#${config.twitch.channels}`, `@${event.userDisplayName} desbaneado`)
           await TwitchService.removeBan(channelId, event.userId)
        })

        this.middleware.onChannelPollBegin(channelId, async event => {
            logger.debug(`Poll ${event.title} has started!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `Encuesta iniciada: ${event.title}, vota!`)
        })

        this.middleware.onChannelVipAdd(channelId, async event => {
            logger.debug(`User ${event.userDisplayName} has been added as VIP!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} es ahora un mansón del canal! FBtouchdown FBtouchdown FBtouchdown FBtouchdown`)
        })

        this.middleware.onChannelVipRemove(channelId, async event => {
            logger.debug(`User ${event.userDisplayName} has been removed as VIP!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ya no forma parte de la masonería del canal!`)
        })

        this.middleware.onChannelModeratorAdd(channelId, async event => {
            logger.debug(`User ${event.userDisplayName} has been added as moderator!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ha ascendido al alto rango de la masonería!`)
        })

        this.middleware.onChannelModeratorRemove(channelId, async event => {
            logger.debug(`User ${event.userDisplayName} has been removed as moderator!`);
            await this.twitchBot.say(`#${config.twitch.channels}`, `¡${event.userDisplayName} ha degradado del alto rango de la masonería!`)
        })

        this.middleware.onStreamOnline(channelId, async event => {
            logger.debug(`Stream ${event.broadcasterDisplayName} has started!`);
            await WhisperService.start()
            await this.twitchBot.say(`#${config.twitch.channels}`, `Gente, estamos Online`)
        })

        this.middleware.onStreamOffline(channelId, async event => {
            logger.debug(`Stream ${event.broadcasterDisplayName} has ended!`);
            await WhisperService.stop()
            await this.twitchBot.say(`#${config.twitch.channels}`, `Luego abro, Offline`)
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

