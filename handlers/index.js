const Generic = require('./generic')
const Weather = require('./Weather')
const Train = require('./Train')
const Stream = require('./Stream')

module.exports = {
    generic: new Generic(),
    weather: new Weather(),
    train: new Train(),
    stream: new Stream()
}
