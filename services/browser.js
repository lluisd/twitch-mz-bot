const browserApi = require('../helpers/browserApi.js')
const { customAlphabet, urlAlphabet } = require('nanoid')
const nanoid = customAlphabet(urlAlphabet, 5)
const sharp = require('sharp')
const logger = require('../lib/logger')

async function getScreenshot() {
    let bufferImage
    try {
        await this.startAndWarmUpBrowserIfNeeded()
    } catch (error) {
        logger.error(error)
        return null
    }
    const name = nanoid()
    try {
        bufferImage = await browserApi.takeScreenshot(`public/images/${name}.jpg`)
        sharp(bufferImage)
            .resize({ width: 200 })
            .toFile(`public/images/t_${name}.jpg`).catch(() => { logger.error('rsize image for thumbnail')})
    } catch (error) {
        logger.error(error)
        return null
    }
    return {buffer: bufferImage, fileName: name }
}

async function startAndWarmUpBrowserIfNeeded() {
    const browserIsOpen = await browserApi.checkIfBrowserIsOpen()

    if (!browserIsOpen) {
        logger.info('Browser is not open, creating new one')
        await browserApi.createNewBrowser()
        logger.info('creating new page also')
        await browserApi.createNewPage()
    } else {
        const pageIsOpen = await browserApi.checkIfPageIsOpen()
        if (!pageIsOpen) {
            logger.info('Page is not open, creating new one')
            await browserApi.createNewPage()
        }
    }
}

async function refreshPage() {
    const browserIsOpen = await browserApi.checkIfBrowserIsOpen()
    const pageIsOpen = await browserApi.checkIfPageIsOpen()
    if (browserIsOpen && pageIsOpen) {
        await browserApi.refreshPage()
    }
}

async function closeBrowser() {
    return await browserApi.closeBrowser()
}

async function closeBrowserIfNeeded() {
    const isOpened = await browserApi.checkIfBrowserIsOpen()
    if (isOpened) {
        await browserApi.closeBrowser()
    }
}

module.exports = {
    getScreenshot,
    closeBrowser,
    closeBrowserIfNeeded,
    startAndWarmUpBrowserIfNeeded,
    refreshPage
}
