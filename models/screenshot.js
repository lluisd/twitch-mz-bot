const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Channel Schema */
const ScreenshotSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    roomId: {
        type: Number,
        required: true
    },
    streamId: {
        type: Number,
        required: false
    },
    capturedBy: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('screenshot', ScreenshotSchema, 'screenshots')
