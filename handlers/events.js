config = require("../config")
const TwitchService = require('../services/twitch')

class Events {
    async sendTarracoMangaEvent() {
        if (config.twitch.channels.startsWith('m')) {
            //await TwitchService.sendAnnouncement(`¡28 y 29 de septiembre quedada en la Tarraco Manga con followers!`, 'orange')
       }
    }
}

module.exports = Events
