const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Block Schema */
const BlockSchema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('block', BlockSchema, 'blocks')
