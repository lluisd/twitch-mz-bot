const mongoose = require('mongoose')
const config = require("../config");
const Schema = mongoose.Schema
const db =    await mongoose.connect(config.openAI.database)
    .then()
    .catch(err => console.error("MongoDB secondary connection failed, " + err));

/* Log Schema */
const LogSchema = new Schema({
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

module.exports = db.model('log', LogSchema, 'logs')
