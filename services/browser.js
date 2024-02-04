const config = require('../config')
const puppeteer = require("puppeteer");
require('mathjs')

async function getScreenshot() {
    const browser = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
    const session = await page.target().createCDPSession()
    await session.send("Page.enable")

    await page.setViewport({ width: 1920, height: 1080 })

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
}



module.exports = {
    getScreenshot
}
