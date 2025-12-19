const config = require('../config')
const moment = require('moment')

let accessToken = null
let expiresAt = 0
let refreshing = null


async function _requestNewToken() {
    try {
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: config.kick.clientId,
            client_secret: config.kick.clientSecret
        });

        const res = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Kick token error ${res.status}: ${text}`)
        }

        return await res.json();
    } catch (err) {
        console.error('[Kick] Error obteniendo token:', err)
        throw err
    }
}

async function getKickToken() {
    if (accessToken && expiresAt && moment().isBefore(expiresAt)) {
        return accessToken
    }

    if (refreshing) {
        return refreshing
    }

    refreshing = (async () => {
        try {
            const data = await _requestNewToken()

            accessToken = data.access_token
            expiresAt = moment()
                .add(data.expires_in, 'seconds')
                .subtract(2, 'days')

            return accessToken
        } catch (err) {
            accessToken = null
            expiresAt = 0
            throw err
        } finally {
            refreshing = null
        }
    })();

    return refreshing
}

function invalidateKickToken() {
    accessToken = null
    expiresAt = null
}

module.exports = {
    invalidateKickToken,
    getKickToken
}
