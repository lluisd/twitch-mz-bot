const Generic = require('./generic')
const Weather = require('./weather')
const Stream = require('./stream')
const Birthday = require('./birthday')
const TempsDeFlors = require('./tempsDeFlors')
const Ban = require('./ban')
const Events = require('./events')
const OpenAI = require('./openAI')
const Kick = require('./kick')

module.exports = {
    generic: new Generic(),
    weather: new Weather(),
    stream: new Stream(),
    birthday: new Birthday(),
    tempsDeFlors: new TempsDeFlors(),
    ban: new Ban(),
    events: new Events(),
    openAI: new OpenAI(),
    kick: new Kick()
}
