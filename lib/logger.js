const { createLogger, transports, format } = require("winston")
const LokiTransport = require("winston-loki")
const config = require("../config")

const options = {
    level: 'info',
    transports: [
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
        }),
        new transports.Console({
            format: format.combine(format.simple(), format.colorize())
        })
    ]
}

const logger = createLogger(options)
module.exports = logger