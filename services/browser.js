const config = require('../config')
const puppeteer = require("puppeteer-core")
require('mathjs')

async function getScreenshot() {
    try {
        const browser = await puppeteer.connect({ browserWSEndpoint: `wss://${config.browserlessUrl}` })
        const page = await browser.newPage()
        await page.goto("https://www.twitch.tv/" + config.twitch.channels, { waitUntil: 'networkidle0' })
        await page.waitForSelector('div.persistent-player')
        await page.$eval('.video-player__default-player', el => el.remove())
        const svgImage = await page.$('div.persistent-player')
        const name = Math.random().toString(36).substring(2,8)
        const bufferImage = await svgImage.screenshot({
            path: `public/images/${name}.png`,
            omitBackground: true
        })
        await browser.close()

        return {buffer: bufferImage, fileName: `${name}.png` }
    } catch (error) {
        console.log(error)
        return null
    }

}



module.exports = {
    getScreenshot
}
