const Messenger = require('./lib/messenger')
const mongoose = require('mongoose')
const config = require('./config')
const express = require("express")
const Notifier = require('./lib/notifier')

mongoose.connect(config.database).then(() => {
    const messenger = new Messenger()
    messenger.init()
        .then(() => {
            console.log('Connected')

            const app = express();
            const listener = app.listen(process.env.PORT, ()=>  {
                console.log('Listening on port ', + listener.address().port)
                app.get('/', (req, res) => res.send('Hello World!'))
            })
        })
    const notifier = new Notifier()
    notifier.notify()
})





