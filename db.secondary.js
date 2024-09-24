const mongoose = require("mongoose");
const config = require('./config')

module.exports = () => {
    // Connect to MongoDB
    mongoose.connect(config.openAI.database)
        .then()
        .catch(err => console.error("MongoDB secondary connection failed, " + err));
}
