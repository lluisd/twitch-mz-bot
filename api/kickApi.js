const endpointPrefix = 'https://api.kick.com/public/v1/'

class KickApi {
    constructor({ authProvider }) {
        this.authProvider = authProvider
    }

    async request(method, endpoint, body) {
        const token = await this.authProvider.getAccessToken()

        const res = await fetch(`${endpointPrefix}${endpoint}`, {
            method,
            headers: {
                'Host': 'api.kick.com',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: body ? JSON.stringify(body) : undefined
        })

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Kick API ${res.status}: ${text}`)
        }

        return res.json()
    }
}

module.exports = KickApi