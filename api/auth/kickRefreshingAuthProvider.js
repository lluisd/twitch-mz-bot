const config = require('../../config')
const moment = require("moment")
require('moment/locale/es')
moment.locale('es')

class KickRefreshingAuthProvider {
    constructor() {
        this.clientId = config.kick.clientId
        this.clientSecret = config.kick.clientSecret

        this.accessToken = null
        this.refreshToken = null
        this.expiresIn = null
        this.obtainmentTimestamp = null; // en ms

        this.refreshCallback = null
        this.refreshingPromise = null
    }

    onRefresh(callback) {
        this.refreshCallback = callback
    }

    async addUserForToken(tokenData) {
        this.accessToken = tokenData.accessToken
        this.refreshToken = tokenData.refreshToken
        this.expiresIn = tokenData.expiresIn
        this.obtainmentTimestamp = tokenData.obtainmentTimestamp
    }

    isExpired() {
        if (!this.accessToken || !this.obtainmentTimestamp || !this.expiresIn) {
            return true
        }

        const expiresAt = moment(this.obtainmentTimestamp).add(this.expiresIn, 'seconds')
        return moment().isAfter(expiresAt)
    }

    async getAccessToken() {
        if (!this.isExpired()) {
            return this.accessToken
        }

        if (!this.refreshingPromise) {
            this.refreshingPromise = this.refreshTokenInternal()
        }

        await this.refreshingPromise
        this.refreshingPromise = null

        return this.accessToken
    }

    async refreshTokenInternal() {
        const res = await fetch("https://id.kick.com/oauth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret
            })
        })

        if (!res.ok) {
            throw new Error("Kick token refresh failed")
        }

        const data = await res.json()

        this.accessToken = data.access_token
        this.refreshToken = data.refresh_token ?? this.refreshToken
        this.expiresIn = data.expires_in
        this.obtainmentTimestamp = moment().valueOf()

        if (this.refreshCallback) {
            await this.refreshCallback({
                accessToken: this.accessToken,
                expiresIn: this.expiresIn,
                refreshToken: this.refreshToken,
                obtainmentTimestamp: this.obtainmentTimestamp,
                scope: data.scope
            })
        }
    }
}

module.exports = KickRefreshingAuthProvider
