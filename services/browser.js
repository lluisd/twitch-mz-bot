const browserApi = require('../helpers/browserApi.js')
require('mathjs')

async function getScreenshot() {
    let bufferImage
    try {
        await this.startAndWarmUpBrowserIfNeeded()
    } catch (error) {
        console.log(error)
        return null
    }
    const name = Math.random().toString(36).substring(2,8)
    try {
        bufferImage = await browserApi.takeScreenshot(`public/images/${name}.jpg`)
    } catch (error) {
        console.log(error)
        return null
    }
    return {buffer: bufferImage, fileName: `${name}.jpg` }
}

async function startAndWarmUpBrowserIfNeeded() {
    const browserIsOpen = await browserApi.checkIfBrowserIsOpen()

    if (!browserIsOpen) {
        console.log('Browser is not open, creating new one')
        await browserApi.createNewBrowser()
        console.log('creating new page also')
        await browserApi.createNewPage()
    } else {
        const pageIsOpen = await browserApi.checkIfPageIsOpen()
        if (!pageIsOpen) {
            console.log('Page is not open, creating new one')
            await browserApi.createNewPage()
        }
    }
}

async function refreshPage() {
    await browserApi.refreshPage()
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
