const dbManager = require('../helpers/dbmanager')

async function getMunicipioCode(name) {
    let result = null

    name = name.trim()
    const articles = ['El', 'La', 'Las', 'Los', 'L', 'Es', 'L\'','Les', 'Els', 'O', 'A', 'As', 'l\'']
    articles.forEach(article => {
        article = article + ' '
        const regEx = new RegExp('^' + article, "ig");
        name = name.replace(regEx, '')
    })

    name = name.replaceAll('a', '[àáa]')
    name = name.replaceAll('e', '[èée]')
    name = name.replaceAll('i', '[ïií]')
    name = name.replaceAll('o', '[òóo]')
    name = name.replaceAll('u', '[uúü]')

    result = await dbManager.getMunicipio(name)
    if (result !== null) return result
    result = await dbManager.getMuncipioStartsWith(name)
    if (result !== null) return result
    result = await dbManager.getMuncipioEndsWith(name)
    if (result !== null) return result
    result = await dbManager.getMuncipioContains(name)

    return result
}

module.exports = {
    getMunicipioCode
}
