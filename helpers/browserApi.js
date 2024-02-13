const puppeteer = require('puppeteer-core')
const config = require('../config')

class PuppeteerApi {
    browser = null
    page = null
    svgImage = null

    async createNewBrowser() {
        this.browser = await puppeteer.connect({ browserWSEndpoint: config.browserlessUrl })
        this.browser.on('disconnected', async () => {
            console.log('disconnected browser')
            if (this.browser) await this.browser.close()
            if (this.browser && this.browser.process() != null) this.browser.process().kill('SIGINT')
            this.browser = null
        })
    }

    async createNewPage() {
        this.page = this.browser.newPage()
        await this.handleStart()
    }

    async handleStart() {
        await this.page.setViewport({ width: 1920, height: 1080 })
        await this.page.goto("https://www.twitch.tv/" + config.twitch.channels, { waitUntil: ['networkidle0',  'domcontentloaded'] })

        await this.removeElementsAndGetDiv()
    }

    async removeElementsAndGetDiv() {
        await this.page.$eval('button[data-a-target="consent-banner-accept"]', el =>  el.click()).catch(() => {})
        await this.page.$eval('#twilight-sticky-footer-root', el => el.remove()).catch(() => {})
        await this.page.$eval('button[data-a-target="content-classification-gate-overlay-start-watching-button"]', el =>  el.click()).catch(() => {})
        await this.page.waitForSelector('div.persistent-player')
        await this.page.$eval('.video-player__default-player', el => el.remove())
        this.svgImage = await this.page.$('div.persistent-player')
    }

    async refreshPage() {
        await this.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
        await this.removeElementsAndGetDiv()
    }

    async takeScreenshot(path) {
        if (this.svgImage) {
            return await this.svgImage.screenshot({
                path: path,
                omitBackground: true
            })
        }
        return null
    }

    async checkIfBrowserIsOpen() {
        let isConnected = false
        if (this.browser) {
            isConnected = await this.browser.isConnected()
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

    async closeBrowser() {
        await this.browser.close()
    }
}

const browserApi = new PuppeteerApi()
module.exports = browserApi
