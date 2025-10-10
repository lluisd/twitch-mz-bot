const Messenger = require('./lib/messenger')
const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")
const randomLinks = require("./config/randomLinks.json");
const TempsDeFlorsService = require('./services/tempsDeFlors')
const TwitchService = require("./services/twitch");
const ScreenshotService = require("./services/screenshot");
const HAService = require("./services/ha");
const moment = require('moment-timezone')
const EventSub = require('./lib/eventSub')
const handlers = require('./handlers')
const logger = require('./lib/logger')
const basicAuth = require('./middleware/basicAuth')
const ImmuneService = require('./services/immune')
const { transcribeSemaphore, mergeTranscriptionsSemaphore} = require("./semaphore.js")

async function main () {
    try {
        await mongoose.connect(config.database.uri, {
            dbName: config.database.dbName,
        })

        let twitchBot = null
        let telegramBot = null

        if (config.twitch.enabled) {
            const messenger = new Messenger();
            ({ twitchBot, telegramBot } = await messenger.init());
        }

        logger.info('Connected')

        const app = express()
        app.set('view engine', 'ejs')
        app.use(express.static('public'))
        app.set('trust proxy', 1)

        let num = 0
        app.use((req, res, next) => {
            const publicIp = getClientPublicIp(req);
            logger.debug(`${++num} ${req.method} ${req.url} from ip: ${publicIp}, forwarded for: ${req.headers['x-forwarded-for'] || null}, express ip: ${req.ip}, remote address: ${req.socket?.remoteAddress}`);
            next()
        })

        if (config.twitch.enabled) {
            app.get('/', (req, res) => res.redirect('/stream'));
        } else {
            app.get('/', (req, res) => res.send('Running'));
        }

        app.get('/transcribe', basicAuth, async (req, res, next) => {
            if (transcribeSemaphore.isLocked()) {
                logger.info('called transcribe while already running')
                return;
            }
            const [value, release] = await transcribeSemaphore.acquire()
            try {
                logger.info('Transcription started')
                await HAService.hibernateTranscriberPC()
                await handlers.openAI.uploadStreamToOpenai(`#${config.twitch.channels}`, twitchBot, telegramBot)
                const response = {
                    message: 'transcription started',
                    status: 'success'
                };
                res.json(response);
            } catch (error) {
                next(error)
            } finally {
                release()
            }
        });

        app.get('/:prefix/:mode/mergeTranscriptions', basicAuth, async (req, res, next) => {
            if (transcribeSemaphore.isLocked()) {
                logger.info('called mergeTranscriptions while already running')
                return;
            }
            const [value, release] = await mergeTranscriptionsSemaphore.acquire()
            try {
                const { prefix, mode } = req.params

                const validPrefixes = ['chat', 'stream']
                const validModes = ['files', 'vector']

                if (!validPrefixes.includes(prefix)) {
                    return res.status(400).json({ error: `Prefijo inválido: ${prefix}` });
                }

                if (!validModes.includes(mode)) {
                    return res.status(400).json({ error: `Modo inválido: ${mode}` });
                }

                logger.info('Transcription started')
                await handlers.openAI.mergePreviousMonthsUploadedVectorFilesByMonth(mode, prefix)
                const response = {
                    message: 'merge transcriptions started',
                    status: 'success'
                };
                res.json(response);
            } catch (error) {
                next(error)
            } finally {
                release()
            }
        });

        app.get('/p/:id', async (req, res, next) => {
            try {
                const spotNumber = parseInt(req.params.id)
                if (!isNaN(spotNumber)) {
                    const spot = await TempsDeFlorsService.getTFSpot(config.twitch.roomId, spotNumber)
                    res.redirect(`https://www.google.com/maps?q=${spot.coordinates}`)
                } else {
                    res.json('invalid spot')
                }
            } catch (error) {
                next(error)
            }
        });

        app.get('/pdf/:id', async (req, res, next) => {
            try {
                const spotNumber = parseInt(req.params.id)
                if (!isNaN(spotNumber)) {
                    res.redirect(`https://web2.girona.cat/tempsdeflors/docs/espais/2025/${spotNumber}.pdf`)
                } else {
                    res.json('invalid spot')
                }
            } catch (error) {
                next(error)
            }
        });

        app.get('/reto', async (req, res, next) => {
            try {
                const spots = await TempsDeFlorsService.getTFSpots(config.twitch.roomId)
                const percentage = parseFloat((spots.filter((s) => s.visited).length / spots.length * 100).toFixed(2))
                res.render('pages/list', {
                    spots: spots,
                    url: config.externalUrl,
                    channel: config.twitch.channels,
                    percentage: percentage,
                    moment: moment,
                    bgClass: percentage > 50 ? 'bg-success' : (percentage > 25 ? 'bg-warning' : 'bg-danger')
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/fotos', async (req, res, next) => {
            try {
                const spots = await TempsDeFlorsService.getTFSpots(config.twitch.roomId)
                res.render('pages/gallery', {
                    spots: spots.filter((s) => s.screenshot !== null),
                    url: config.externalUrl,
                    channel: config.twitch.channels,
                    moment: moment,
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/stream', async (req, res, next) => {
            try {
                const channel = await TwitchService.getChannel()
                if (channel) {
                    const screenshots = await ScreenshotService.getScreenshots(channel.streamId)
                    res.render('pages/stream', {
                        screenshots: screenshots,
                        url: config.externalUrl,
                        channel: config.twitch.channels,
                        moment: moment,
                        title: channel.title
                    })
                }
            } catch (error) {
                next(error)
            }
        });

        app.get('/comandos', async (req, res, next) => {
            try {
                res.render('pages/comandos', {
                    channel: config.twitch.channels
                });
            } catch (error) {
                next(error)
            }
        });

        app.get('/rutas', async (req, res, next) => {
            try {
                res.render('pages/rutas', {
                    channel: config.twitch.channels
                });
            } catch (error) {
                next(error)
            }
        });

        app.get('/bans', async (req, res, next) => {
            try {
                const bans = await TwitchService.getBannedAndBlockedUsers(moment().subtract(10, 'years').startOf('year').toDate())
                res.render('pages/bans', {
                    bans: bans.filter(ban => config.blacklistUsers.indexOf(ban.userId.toString()) === -1)
                        .map(e => {
                            const now = moment().tz('Europe/Madrid');
                            const creationDate = moment(e.creationDate);
                            const duration = moment.duration(now.diff(creationDate));
                            return {
                                ...e,
                                days: Math.floor(duration.asDays()),
                                hours: duration.hours(),
                                minutes: duration.minutes()
                            }
                        })
                        .reverse(),
                    url: config.externalUrl,
                    channel: config.twitch.channels
                });
            } catch (error) {
                next(error)
            }
        });

        app.get('/timeouts', async (req, res, next) => {
            try {
                const timeouts = await TwitchService.getTimeouts()
                res.render('pages/timeouts', {
                    timeouts: timeouts
                        .map(e => {
                            const now = moment().tz('Europe/Madrid');
                            const expiryMoment = moment(e.expiryDate);
                            const duration = moment.duration(expiryMoment.diff(now));
                            return {
                                ...e,
                                days: duration.days(),
                                hours: duration.hours(),
                                minutes: duration.minutes(),
                                seconds: duration.seconds()
                            }
                        })
                        .reverse(),
                    url: config.externalUrl,
                    channel: config.twitch.channels
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/vips', async (req, res, next) => {
            try {
                const vips = await TwitchService.getVips()
                res.render('pages/vips', {
                    vips: vips,
                    url: config.externalUrl,
                    channel: config.twitch.channels
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/mods', async (req, res, next) => {
            try {
                const mods = await TwitchService.getMods()
                res.render('pages/mods', {
                    mods: mods,
                    url: config.externalUrl,
                    channel: config.twitch.channels
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/immunes', async (req, res, next) => {
            try {
                const immunes = await ImmuneService.getImmunes()
                res.render('pages/immunes', {
                    url: config.externalUrl,
                    channel: config.twitch.channels,
                    immunes: await Promise.all(immunes.map(async (immune) => {
                        const user = await TwitchService.getUserById(immune.userId);
                        const now = moment().tz('Europe/Madrid')
                        const expiryMoment = moment(immune.expiryDate)
                        const duration = moment.duration(expiryMoment.diff(now))
                        return {
                            username: user.displayName,
                            slot: immune.slot,
                            bans: immune.bans,
                            days: duration.days(),
                            hours: duration.hours(),
                            minutes: duration.minutes(),
                            seconds: duration.seconds()
                        }
                    }))
                })
            } catch (error) {
                next(error)
            }
        });

        app.get('/i/:id', async (req, res, next) => {
            try {
                const {id} = req.params;
                const channel = await TwitchService.getChannel()
                if (channel) {
                    const screenshots = await ScreenshotService.getScreenshots(channel.streamId)
                    if (screenshots.length > 0) {
                        const image = screenshots.find((s) => s.name === id)
                        if (image) {
                            res.redirect(config.externalUrl + `/stream/#lg=1&slide=${id}`);
                        } else {
                            res.sendFile(__dirname + `/public/images/${id}.jpg`)
                        }
                    } else {
                        res.sendFile(__dirname + `/public/images/${id}.jpg`)
                    }
                } else {
                    res.sendFile(__dirname + `/public/images/${id}.jpg`)
                }
            } catch (error) {
                next(error)
            }
        });

        app.get('/t/:id', async (req, res, next) => {
            try {
                const {id} = req.params;
                const channel = await TwitchService.getChannel()
                if (channel) {
                    const screenshots = await ScreenshotService.getScreenshots(channel.streamId)
                    if (screenshots.length > 0) {
                        const image = screenshots.find((s) => s.name === id)
                        if (image) {
                            res.redirect(config.externalUrl + `/fotos/#lg=1&slide=${id}`);
                        } else {
                            res.sendFile(__dirname + `/public/images/${id}.jpg`)
                        }
                    } else {
                        res.sendFile(__dirname + `/public/images/${id}.jpg`)
                    }
                } else {
                    res.sendFile(__dirname + `/public/images/${id}.jpg`)
                }
            } catch (error) {
                next(error)
            }
        });

        app.get('/img/:id', async (req, res, next) => {
            try {
                res.sendFile(__dirname + `/public/images/${req.params.id}.jpg`)
            } catch (error) {
                next(error)
            }
        });

        app.get('/OF/:id', async (req, res, next) => {
            try {
                const position = parseInt(req.params.id.replace(config.twitch.channels, ''))
                const link = randomLinks.links[position]
                res.redirect(link.link);
            } catch (error) {
                next(error)
            }
        })

        app.use('/images', express.static('images'));

        app.use((err, req, res, next) => {
            logger.error(err.stack)
            res.status(500).json({message: "Server error."});
        })

        let eventSub = null
        if (config.twitch.enabled) {
            eventSub = new EventSub();
            await eventSub.init(twitchBot, telegramBot)
            eventSub.apply(app)
        }

        const listener = app.listen(process.env.PORT, async () => {
            logger.info('Listening on port ' + listener.address().port)
            if (config.twitch.enabled) {
                await eventSub.markAsReady()
                await eventSub.subscribeEvent(config.twitch.roomId)
            }
        })
    } catch (err) {
        logger.error("Fatal startup error:", err)
        process.exit(1)
    }
}

function isPrivate(ip) {
    return (
        /^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
        /^fc00:|^fe80:|^::1$/.test(ip)
    );
}

function getClientPublicIp(req) {
    const ip = req.ip;
    if (ip && !isPrivate(ip)) return ip;

    const xff = req.headers['x-forwarded-for'];
    if (xff) {
        const ips = xff.split(',').map(s => s.trim());
        for (const candidate of ips) {
            const cleanIp = candidate.split(':')[0];
            if (!isPrivate(cleanIp)) return cleanIp;
        }
        return ips[0];
    }

    return req.connection?.remoteAddress || req.socket?.remoteAddress;
}

main()





