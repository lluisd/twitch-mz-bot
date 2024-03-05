const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Channel Schema */
const ChannelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    roomId: {
        type: Number,
        required: true
    },
    live: {
        type: Boolean,
        required: true
    },
    streamId: {
        type: Number,
        required: false
    },
    lastMessageId: {
        type: Number,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    lastUpdate: {
        type: Date,
        required: false
    }

})

module.exports = mongoose.model('channel', ChannelSchema, 'channels')
