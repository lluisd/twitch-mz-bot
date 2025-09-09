const { createLogger, transports, format } = require("winston")
const LokiTransport = require("winston-loki")
const config = require("../config")

let loggerTransports = [
    new transports.Console({
        format: format.combine(format.simple(), format.colorize())
    })
];

// Only add Loki in production
if (config.loki.enabled) {
    loggerTransports.push(
        new LokiTransport({
            batching: true,
            interval: 5,
            host: config.loki.host,
            labels: { container: 'twitch-mz-bot', instance: 'azure' },
            basicAuth: config.loki.basicAuth,
            json: true,
            format: format.simple(),
            replaceTimestamp: true,
            onConnectionError: (err) => console.error('error connecting to Loki:', err),
        })
    );
}


const options = {
    level: 'debug',
    transports: loggerTransports
}

const logger = createLogger(options)
module.exports = logger