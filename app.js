const Messenger = require('./lib/messenger')
const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")
const randomLinks = require("./config/randomLinks.json");
const TempsDeFlorsService = require('./services/tempsDeFlors')


mongoose.connect(config.database).then(() => {
    const messenger = new Messenger()
    messenger.init()
        .then(() => {
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
                    res.render('pages/index',{
                        spots: spots,
                        url: config.externalUrl,
                        channel: config.twitch.channels
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

            app.get('/i/:id', (req, res) => {
                res.sendFile(__dirname + `/public/images/${req.params.id}.jpg`)
            });

            app.get('/OF/:id', (req, res) => {
                const position = parseInt(req.params.id.replace(config.twitch.channels, ''))
                const link = randomLinks.links[position]
                res.redirect(link.link);
            })


            const listener = app.listen(process.env.PORT, ()=>  {
                console.log('Listening on port ', + listener.address().port)
                app.get('/', (req, res) => res.redirect('/listado'))
            })
        })
})





