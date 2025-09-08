const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Log Schema */
const ChatLogSchema = new Schema({
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

module.exports = mongoose.model('chatLog', ChatLogSchema, 'chatLogs')
