const Messenger = require('./lib/messenger')
const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")

mongoose.connect(config.database).then(() => {
    const messenger = new Messenger()
    messenger.init()
        .then(() => {
            console.log('Connected')

            const app = express()

            app.use(express.static('public'))
            app.use('/images', express.static('images'))

            app.get('/status', function (req, res) {
                res.redirect(config.statusUrl)
            });

            app.get('/:id', (req, res) => {
                res.sendFile(__dirname + `/public/images/${req.params.id}.jpg`)
            });



            const listener = app.listen(process.env.PORT, ()=>  {
                console.log('Listening on port ', + listener.address().port)
                app.get('/', (req, res) => res.send('Live!'))
            })
        })
})





