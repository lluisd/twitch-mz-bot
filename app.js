const Messenger = require('./lib/messenger')

const messenger = new Messenger()
messenger.listen()
    .then(() => {
        console.log('Connected')
        const express = require('express')

        const app = express();
        var listener = app.listen(process.env.PORT, function() {
            console.log('Listening on port ', + listener.address().port)
            app.get('/', (req, res) => res.send('Hello World!'))
        });
    })
