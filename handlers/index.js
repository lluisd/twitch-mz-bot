const Generic = require('./generic')
const Weather = require('./Weather')
const Stream = require('./Stream')
const Birthday = require('./Birthday')
const TempsDeFlors = require('./TempsDeFlors')
const Ban = require('./Ban')
const Events = require('./Events')

module.exports = {
    generic: new Generic(),
    weather: new Weather(),
    stream: new Stream(),
    birthday: new Birthday(),
    tempsDeFlors: new TempsDeFlors(),
    ban: new Ban(),
    events: new Events()
}
