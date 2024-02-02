const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Channel Schema */
const ChannelSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    live: {
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('channel', ChannelSchema, 'channels')
