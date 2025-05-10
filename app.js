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

mongoose.connect(config.database).then(() => {
    const messenger = new Messenger()
    messenger.init()
        .then(async ({twitchBot, telegramBot}) => {
            logger.info('Connected')

            const app = express()

            app.set('view engine', 'ejs');

            app.use(express.static('public'))

            var num = 0;
            app.use(function (req, res, next) {
                const method = req.method;
                const url = req.url;

                logger.info((++num) + " " + method + " " + url);
                next();
            });

            app.get('/transcribe', async (req, res, next) => {
                try{
                    await HAService.hibernateTranscriberPC()
                    await handlers.openAI.uploadStreamToOpenai(`#${config.twitch.channels}`, twitchBot, telegramBot)
                    const response = {
                        message: 'transcription started',
                        status: 'success'
                    };
                    res.json(response);
                } catch (error) {
                    next(error)
                }
            });

            app.get('/p/:id', async (req, res, next) => {
                try{
                    const spotNumber = parseInt(req.params.id)
                    if (!isNaN(spotNumber)) {
                        const spot = await TempsDeFlorsService.getTFSpot(config.twitch.roomId, spotNumber)
                        res.redirect(`https://www.google.com/maps?q=${spot.coordinates}`)
                    }
                    res.json('invalid spot')
                } catch (error) {
                    next(error)
                }
            });

            app.get('/reto', async (req, res, next) => {
                try {
                    const spots = await TempsDeFlorsService.getTFSpots(config.twitch.roomId)
                    const percentage = parseFloat((spots.filter((s) => s.visited).length / spots.length * 100).toFixed(2))
                    res.render('pages/list',{
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
                try{
                    const spots = await TempsDeFlorsService.getTFSpots(config.twitch.roomId)
                    res.render('pages/gallery',{
                        spots: spots.filter((s) => s.screenshot !== null),
                        url: config.externalUrl,
                        channel: config.twitch.channels
                    })
                } catch (error) {
                    next(error)
                }
            });

            app.get('/stream', async (req, res, next)  => {
                try {
                    const channel = await TwitchService.getChannel()
                    if (channel) {
                        const screenshots = await ScreenshotService.getScreenshots(channel.streamId)
                        res.render('pages/stream',{
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
                    res.render('pages/comandos',{
                        channel: config.twitch.channels
                    });
                } catch (error) {
                    next(error)
                }
            });

            app.get('/rutas', async (req, res, next) => {
                try {
                    res.render('pages/rutas',{
                        channel: config.twitch.channels
                    });
                } catch (error) {
                    next(error)
                }
            });

            app.get('/bans', async (req, res, next) => {
                try {
                    const bans = await TwitchService.getBannedUsersCountByDate(moment().subtract(10, 'years').startOf('year').toDate())
                    res.render('pages/bans',{
                        bans:  bans.filter(ban => config.blacklistUsers.indexOf(ban.userId.toString()) === -1)
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
                    res.render('pages/timeouts',{
                        timeouts:  timeouts
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

            app.use('/images', express.static('images'));

            app.get('/i/:id',  async(req, res , next) => {
                try {
                    const { id } = req.params;
                    const channel = await TwitchService.getChannel()
                    if (channel) {
                        const screenshots= await ScreenshotService.getScreenshots(channel.streamId)
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

            app.use((err, req, res, next) => {
                logger.error(err.stack)
                res.status(500).json({
                    message: "Server error."
                });
            })

            const eventSub = new EventSub();
            await eventSub.init(twitchBot, telegramBot)
            eventSub.apply(app);
            const listener = app.listen(process.env.PORT, async ()=>  {
                logger.info('Listening on port ' + listener.address().port)
                await eventSub.markAsReady()
                await eventSub.subscribeEvent(config.twitch.roomId)
                app.get('/', (req, res) => res.redirect('/stream'))
            })
        }).catch((err) => {
            logger.error('Error on bot initialization', err)
        })
}).catch((err) => {
    logger.error('Error connecting to MongoDB', err)
})






