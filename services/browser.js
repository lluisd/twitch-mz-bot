const browserApi = require('./browser-api.js')
require('mathjs')

async function getScreenshot() {
    let page = null
    try {
        page = await browserApi.getPage()
    } catch (error) {
        console.log(error)
        page = await browserApi.forceNewPage()
        return null
    }
    const name = Math.random().toString(36).substring(2,8)
    const bufferImage = await browserApi.getSvgImage().screenshot({
        path: `public/images/${name}.png`,
        omitBackground: true
    })
    return {buffer: bufferImage, fileName: `${name}.png` }
}

module.exports = {
    getScreenshot
}
