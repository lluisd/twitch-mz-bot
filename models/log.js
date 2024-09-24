const mongoose = require('mongoose')
const Schema = mongoose.Schema
const db =  require("../db.openai")();

/* Log Schema */
const LogSchema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    nick: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
})

const twitchDB = db.useDb('twitch');
module.exports = twitchDB.model('log', LogSchema, 'logs')
