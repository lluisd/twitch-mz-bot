const mongoose = require('mongoose')
const Schema = mongoose.Schema

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

module.exports = mongoose.model('titleLog', TitleLogSchema, 'titleLogs')


