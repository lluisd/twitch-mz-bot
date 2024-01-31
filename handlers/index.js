const Generic = require('./generic')
const Weather = require('./Weather')
const Train = require('./Train')

module.exports = {
    generic: new Generic(),
    weather: new Weather(),
    train: new Train()
}
