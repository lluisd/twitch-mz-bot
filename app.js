const Messenger = require('./lib/messenger')

const messenger = new Messenger()
messenger.listen()
    .then(() => {
        console.log('Connected')
    })
