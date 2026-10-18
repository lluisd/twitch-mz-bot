const config = require('../config')

const CACHE_TTL_MS = 5 * 60 * 1000
let cache = { campaigns: null, expiresAt: 0 }

async function getArchivedCampaigns() {
    if (cache.campaigns && Date.now() < cache.expiresAt) {
        return cache.campaigns
    }

    const { url, apiUser, apiToken } = config.listmonk
    if (!url || !apiUser || !apiToken) {
        throw new Error('Listmonk is not configured')
    }

    const endpoint = new URL(`${url.replace(/\/+$/, '')}/api/campaigns`)
    endpoint.searchParams.append('status', 'finished')
    endpoint.searchParams.append('per_page', 'all')
    endpoint.searchParams.append('no_body', 'true')

    const response = await fetch(endpoint, {
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${apiUser}:${apiToken}`).toString('base64'),
            Accept: 'application/json'
        }
    })
    if (!response.ok) {
        throw new Error(`Listmonk API error ${response.status}`)
    }

    const payload = await response.json()
    const campaigns = (payload?.data?.results ?? [])
        .filter(c => c.status === 'finished' && c.archive === true)
        .sort((a, b) => a.id - b.id)

    cache = { campaigns, expiresAt: Date.now() + CACHE_TTL_MS }
    return campaigns
}

function getPublicUrl() {
    return config.listmonk.publicUrl.replace(/\/+$/, '')
}

function getArchiveUrl(campaign) {
    return `${getPublicUrl()}/archive/${encodeURIComponent(campaign.archive_slug || campaign.uuid)}`
}

module.exports = {
    getArchivedCampaigns,
    getArchiveUrl,
    getPublicUrl
}
