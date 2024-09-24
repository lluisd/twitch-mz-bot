const mongoose = require('mongoose')
const Schema = mongoose.Schema
const db =  require("../db.openai")();

/* Log Schema */
const TitleLogSchema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
})

const twitchDB = db.useDb('twitch');
module.exports = twitchDB.model('titleLog', TitleLogSchema, 'titleLog')
