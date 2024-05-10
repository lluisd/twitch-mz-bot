const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Channel Schema */
const TempsDeFlorsSchema = new Schema({
    number: {
        type: Number,
        required: false
    },
    roomId: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    route: {
        type: Number,
        required: true
    },
    timetable: {
        type: Boolean,
        required: true
    },
    screenshot: {
        type: String,
        required: false
    },
    rating: {
        type: Number,
        required: false
    },
    visited: {
        type: Boolean,
        required: true
    },
    coordinates: {
        type: String,
        required: false
    },
    capturedBy: {
        type: String,
        required: false
    },
    created: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('tempsDeFlors', TempsDeFlorsSchema, 'tempsDeFlors')
