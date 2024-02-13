const puppeteer = require('puppeteer-core')
const config = require('../config')

class PuppeteerApi {
    browser = null
    page = null
    svgImage = null

    constructor() {
    }

    getSvgImage() {
        return this.svgImage
    }


    async createNewBrowser() {
        this.browser = await puppeteer.connect({ browserWSEndpoint: config.browserlessUrl })
        this.browser.on('disconnected', async () => {
            if (this.browser) await this.browser.close()
            if (this.browser.process() != null) this.browser.process().kill('SIGINT')
            this.browser = null
        })
    }

    async getBrowser() {
        if (!this.browser) {
            await this.createNewBrowser()
        }
        return this.browser
    }

    async createNewPage() {
        this.page = await this._newPage()
        await this.handleStart()
    }

    async getPage() {
        if (!this.page) {
            await this.createNewPage()
        }
        return this.page
    }

    async _newPage() {
        const browser = await this.getBrowser()
        return await browser.newPage()
    }

    async handBack(page) {
        // close the page or even reuse it?.
        await page.close()

        // you could add logic for closing the whole browser instance depending what
        // you want.
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


    async closeBrowser() {
        await this.browser.close()
    }

    async checkIfBrowserIsOpen() {
        let isConnected = false
        if (this.browser) {
            isConnected = await this.browser.isConnected()
        }

        return isConnected
    }

    async checkIfPageIsOpen() {
        let isClosed = false
        if (this.page) {
            isClosed = await this.page.isClosed()
        }

        return !isClosed
    }

    async resfreshPage() {
        await this.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
        await this.removeElementsAndGetDiv()
    }


}

const browserApi = new PuppeteerApi()
module.exports = browserApi
