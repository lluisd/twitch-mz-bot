const puppeteer = require('puppeteer-core')
const config = require('../config')
const logger = require('../lib/logger')

class PuppeteerApi {
    browser = null
    page = null
    svgImage = null

    constructor() {
        this.url = `${config.browserless.url}?token=${config.browserless.token}`
        if (config.browserless.version === 'v2') {
            const launchArgs = JSON.stringify({
                stealth: true,
                //ignoreHTTPSErrors: true,
                args: ["--no-sandbox", "--window-size=1920,1080", "--disable-infobars", "--disable-setuid-sandbox", "--start-maximized", "--use-gl=angle", "--use-angle=gl"]
            });
            this.url = `${config.browserless.url}/chrome?token=${config.browserless.token}&launch=${btoa(launchArgs)}&blockAds=true`
        }
    }

    async connectBrowser() {
        this.browser = await puppeteer.connect({ browserWSEndpoint: this.url, defaultViewport : null })
    }

    async disconnectBrowser() {
        if (this.browser) await this.browser.disconnect()
    }

    async closeBrowser() {
        logger.info("browser closed")
        await this.browser.close()
    }

    async createNewBrowser() {
        await this.connectBrowser()
        this.browser.on('disconnected', async () => {
            logger.info('disconnected browser')
            if (this.browser) await this.browser.close()
            if (this.browser && this.browser.process() != null) this.browser.process().kill('SIGINT')
            this.browser = null
        })
    }

    async createNewPage() {
        this.page = await this.browser.newPage()
        await this.handleStart()
    }

    async handleStart() {
        await this.page.setViewport({ width: 1920, height: 1080 })
        await this.page.goto("https://www.twitch.tv/" + config.twitch.channels, { waitUntil: ['networkidle0',  'domcontentloaded'] })
        await new Promise(r => setTimeout(r, 1000))
        await this.removeElementsAndGetDiv()
    }

    async removeElementsAndGetDiv() {
        await this.page.waitForSelector('div.persistent-player')
        await new Promise(r => setTimeout(r, 500))
        await this.page.click('button[data-a-target="content-classification-gate-overlay-start-watching-button"]').catch(() => {})
        await this.page.$eval('div.consent-banner', el =>  el.remove()).catch(() => {})
        await this.page.$eval('#twilight-sticky-footer-root', el => el.remove()).catch(() => {})
        await this.page.$eval('button[data-a-target="content-classification-gate-overlay-start-watching-button"]', el =>  el.click()).catch(() => { })
        await this.page.$eval('.video-player__default-player', el => el.style.display = "")
        const volumeValue = await this.page.$eval('input[data-a-target="player-volume-slider"]', el => el.value);
        const volume = parseInt(volumeValue)
        if (!isNaN(volume) && volume > 0) {
            await this.page.$eval('.video-player__default-player button[data-a-target="player-mute-unmute-button"]', el =>  el.click()).catch(() => {})
        }
        await this.page.$eval('.video-player__default-player button[data-a-target="player-play-pause-button"][data-a-player-state="playing"]', el =>  el.click()).catch(() => {})
        await this.page.$eval('button[data-a-target="player-settings-button"]', el =>  el.click()).catch(() => {})
        await new Promise(r => setTimeout(r, 500))
        await this.page.$eval('button[data-a-target="player-settings-menu-item-quality"]', el =>  el.click()).catch(() => {})
        await new Promise(r => setTimeout(r, 500))
        const inputs = await this.page.$$eval('input[name="player-settings-submenu-quality-option"]', elements => {
            return elements.map(e => {
                return { id: e.id, checked: e.checked }}
            );
        }).catch(() => {})
        if (inputs && inputs.length > 1 && !inputs[1].checked) {
            const inputId = inputs[1].id
            await this.page.click('#' + inputId).catch(() => {})
        } else {
            await this.page.$eval('button[data-a-target="player-settings-button"]', el =>  el.click()).catch(() => {})
        }

        await this.page.$eval('.video-player__default-player', el => el.style.display = "none")
    }

    async refreshPage() {
        await this.page.reload({ waitUntil: ["networkidle2", "domcontentloaded"], timeout: 90000 })   //
        await this.removeElementsAndGetDiv()
    }

    async takeScreenshot(path) {
        let screenshot = null
        await this.page.$eval('.video-player__default-player', el => el.style.display = "none")
        await this.page.$eval('.video-player__default-player button[data-a-target="player-play-pause-button"][data-a-player-state="paused"]', el =>  el.click()).catch(() => {})
        await this.page.waitForSelector('span[data-a-target="video-ad-countdown"]', {hidden: true}).catch(() => { 'waiting for ad countdown hidden'})
        await new Promise(r => setTimeout(r, 500))
        this.svgImage = await this.page.$('div.persistent-player')
        if (this.svgImage) {
             screenshot = await this.svgImage.screenshot({
                path: path,
                type: "jpeg",
                quality: 100,
                captureBeyondViewport: false
            })
        }
        this.page.$eval('.video-player__default-player button[data-a-target="player-play-pause-button"][data-a-player-state="playing"]', el =>  el.click()).catch(() => {})

        return screenshot
    }

    async checkIfBrowserIsOpen() {
        let isConnected = false
        if (this.browser) {
            isConnected = this.browser.connected
        }

        return isConnected
    }

    async checkIfPageIsOpen() {
        let isClosed = true
        if (this.page) {
            isClosed = await this.page.isClosed()
        }

        return !isClosed
    }
}

const browserApi = new PuppeteerApi()
module.exports = browserApi
