const config = require('../config')

function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Protected Area"')
        return res.status(401).send('Autenticación requerida')
    }

    const base64Credentials = authHeader.split(' ')[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [username, password] = credentials.split(':')

    if (username === config.basicAuth.username && password === config.basicAuth.password) {
        req.user = { username }
        next()
    } else {
        res.status(403).send('Credenciales inválidas')
    }
}

module.exports = basicAuth