const browserApi = require('../helpers/browserApi.js')
require('mathjs')

async function getScreenshot() {
    let bufferImage
    try {
        await browserApi.getPage()
    } catch (error) {
        console.log(error)
        await this.startAndWarmUpBrowserIfNeeded()
        return null
    }
    const name = Math.random().toString(36).substring(2,8)
    try {
        bufferImage = await browserApi.getSvgImage().screenshot({
            path: `public/images/${name}.png`,
            omitBackground: true
        })
    } catch (error) {
        console.log(error)
        return null
    }
    return {buffer: bufferImage, fileName: `${name}.png` }
}

async function closeBrowser() {
    return await browserApi.closeBrowser()
}

async function startAndWarmUpBrowserIfNeeded() {
    const browserIsOpen = await browserApi.checkIfBrowserIsOpen()

    if (!browserIsOpen) {
        await browserApi.createNewBrowser()
    }
    const pageIsOpen = await browserApi.checkIfPageIsOpen()
    if (!pageIsOpen) {
        await browserApi.createNewPage()
    }
}

async function refreshPage() {
    await browserApi.resfreshPage()
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
