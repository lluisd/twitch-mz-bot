const puppeteer = require('puppeteer-core')
const config = require('../config')

class PuppeteerApi {
    browser = null
    page = null
    svgImage = null

    async createNewBrowser() {
        this.browser = await puppeteer.connect({ browserWSEndpoint: config.browserlessUrl, defaultViewport : null })
        this.browser.on('disconnected', async () => {
            console.log('disconnected browser')
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
        //const fullPage = await this.page.$('body')
        //const fullPageSize = await fullPage.boundingBox()
        //await this.page.setViewport({ width: 1920, height: parseInt(fullPageSize.height) })
        await this.removeElementsAndGetDiv()
    }

    async removeElementsAndGetDiv() {
        await this.page.waitForSelector('div.persistent-player')
        await this.page.$eval('button[data-a-target="consent-banner-accept"]', el =>  el.click()).catch(() => {})
        await this.page.$eval('#twilight-sticky-footer-root', el => el.remove()).catch(() => {})
        await this.page.$eval('button[data-a-target="content-classification-gate-overlay-start-watching-button"]', el =>  el.click()).catch(() => { })
        //await this.page.$eval('button[data-a-target="right-column__toggle-collapse-btn"]', el =>  el.click()).catch(() => { "toggle collapse btn"})
        await this.page.$eval('.video-player__default-player', el => el.remove())
    }

    async refreshPage() {
        await this.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
        await this.removeElementsAndGetDiv()
    }

    async takeScreenshot(path) {
        this.svgImage = await this.page.$('div.persistent-player')
        if (this.svgImage) {
            return await this.svgImage.screenshot({
                path: path,
                type: "jpeg",
                quality: 100,
                captureBeyondViewport: false
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
