const browserApi = require('./browser-api.js')
require('mathjs')

async function getScreenshot() {
    try {
        const page = await browserApi.getPage()



        const name = Math.random().toString(36).substring(2,8)
        const bufferImage = await browserApi.getSvgImage().screenshot({
            path: `public/images/${name}.png`,
            omitBackground: true
        })

        return {buffer: bufferImage, fileName: `${name}.png` }
    } catch (error) {
        console.log(error)
        return null
    }

}



module.exports = {
    getScreenshot
}
