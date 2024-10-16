const Messenger = require('./lib/messenger')
const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")
const randomLinks = require("./config/randomLinks.json");
const TempsDeFlorsService = require('./services/tempsDeFlors')
const TwitchService = require("./services/twitch");
const ScreenshotService = require("./services/screenshot");
const moment = require('moment-timezone')
const EventSub = require('./lib/eventSub')

mongoose.connect(config.database).then(() => {
    const messenger = new Messenger()
    messenger.init()
        .then((res) => {
            console.log('Connected')

            const app = express()

            app.set('view engine', 'ejs');

            app.use(express.static('public'))

            app.get('/p/:id', (req, res) => {
                const spotNumber = parseInt(req.params.id)
                if (typeof spotNumber === 'number') {
                    TempsDeFlorsService.getTFSpot(config.twitch.roomId, spotNumber).then((spot) => {
                        res.redirect(`https://www.google.com/maps?q=${spot.coordinates}`)
                    })
                }
            });

            app.get('/listado', function(req, res) {
                TempsDeFlorsService.getTFSpots(config.twitch.roomId).then((spots) => {
                    const percentage = parseFloat((spots.filter((s) => s.visited).length / spots.length * 100).toFixed(2))
                    res.render('pages/index',{
                        spots: spots,
                        url: config.externalUrl,
                        channel: config.twitch.channels,
                        percentage: percentage,
                        bgClass: percentage > 50 ? 'bg-success' : (percentage > 25 ? 'bg-warning' : 'bg-danger')
                    });
                })
            });

            app.get('/fotos', function(req, res) {
                TempsDeFlorsService.getTFSpots(config.twitch.roomId).then((spots) => {
                    res.render('pages/gallery',{
                        spots: spots.filter((s) => s.screenshot !== null),
                        url: config.externalUrl,
                        channel: config.twitch.channels
                    });
                })
            });

            app.get('/stream', function(req, res) {
                TwitchService.getChannel().then(async (channel) => {
                    if (channel) {
                        const screenshots = await ScreenshotService.getScreenshots(channel.streamId)
                        res.render('pages/stream',{
                            screenshots: screenshots,
                            url: config.externalUrl,
                            channel: config.twitch.channels,
                            moment: moment,
                            title: channel.title
                        });
                    }
                });
            });

            app.get('/comandos', function(req, res) {
                res.render('pages/comandos',{
                    channel: config.twitch.channels
                });
            });

            app.get('/rutas', function(req, res) {
                res.render('pages/rutas',{
                    channel: config.twitch.channels
                });
            });

            app.use('/images', express.static('images'));

            app.get('/i/:id',  async(req, res) => {
                const { id } = req.params;
                TwitchService.getChannel().then((channel) => {
                    if (channel) {
                        ScreenshotService.getScreenshots(channel.streamId).then ((screenshots) => {
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
                        });
                    } else {
                        res.sendFile(__dirname + `/public/images/${id}.jpg`)
                    }
                });
            });

            app.get('/img/:id', (req, res) => {
                res.sendFile(__dirname + `/public/images/${req.params.id}.jpg`)
            });

            app.get('/OF/:id', (req, res) => {
                const position = parseInt(req.params.id.replace(config.twitch.channels, ''))
                const link = randomLinks.links[position]
                res.redirect(link.link);
            })

            const eventSub = new EventSub();
            eventSub.init(res.apiClient, res.bot)
            eventSub.apply(app);
            const listener = app.listen(process.env.PORT, async ()=>  {
                console.log('Listening on port ', + listener.address().port)
                await eventSub.markAsReady()
                await eventSub.subscribeEvent(config.twitch.roomId)
                app.get('/', (req, res) => res.redirect('/stream'))
            })
        })
})






