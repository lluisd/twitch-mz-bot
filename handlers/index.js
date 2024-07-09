const Generic = require('./generic')
const Weather = require('./Weather')
const Train = require('./Train')
const Stream = require('./Stream')
const Birthday = require('./Birthday')
const TempsDeFlors = require('./TempsDeFlors')
const Ban = require('./Ban')

module.exports = {
    generic: new Generic(),
    weather: new Weather(),
    train: new Train(),
    stream: new Stream(),
    birthday: new Birthday(),
    tempsDeFlors: new TempsDeFlors(),
    ban: new Ban()
}
