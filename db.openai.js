const mongoose = require("mongoose");
const config = require('./config')

class Mongo {
    constructor() {
        this.connection = null
    }

    async getConnection() {
        if (this.connection === null) {
            const conn = await mongoose.createConnection(config.openAI.database).asPromise();
            const connTwitchDB = conn.useDb('twitch', { useCache: true })
            connTwitchDB.model('titleLog', require('./models/titleLog'), 'titleLog')
            connTwitchDB.model('chatLog', require('./models/chatLog'), 'chatLogs')
            this.connection = connTwitchDB
        }
        return this.connection
    }
}

module.exports = new Mongo()
