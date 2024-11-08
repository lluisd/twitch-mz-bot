const config = require("../config")

class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dados')
    }

    isAskingForOF (text) {
        const words = ['of', 'only']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForSunset (text) {
        return text.startsWith('!atardecer')
    }

    isAskingForSunrise (text) {
        return text.startsWith('!amanecer')
    }

    isAskingForTakeScreenshot (text) {
        return text.toLowerCase().startsWith('!foto')
    }

    isAskingForShowScreenshots (text) {
        return text.toLowerCase().startsWith('!fotos')
    }

    isAskingForF5 (text) {
        return text.toLowerCase().startsWith('!f5')
    }

    isAskingToSetOnChannelFollowNotificationMessage (text) {
        return text.toLowerCase().startsWith('!followers')
    }

    isAskingForGetBirthday (text) {
        return text.toLowerCase().startsWith('!cumple')
    }

    isAskingForAddBirthday (text) {
        return text.toLowerCase().startsWith('!micumple')
    }

    isAskingForServerStatus (text) {
        return text.toLowerCase().startsWith('!estado')
    }

    isAskingForTFVisited (text) {
        return text.toLowerCase().startsWith('!visto')
    }

    isAskingForTFNotVisited (text) {
        const words = ['borrar', 'novisto']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForTFActiveSpot(text) {
        const words = ['activo', 'activa']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForTFDeactivateSpot(text) {
        const words = ['desactivar', 'desactivo', 'desactiva']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForTFSpot (text) {
        return text.toLowerCase().startsWith('!punto')
    }

    isAskingForTFScreenshot (text) {
        return text.toLowerCase().startsWith('!foto')
    }

    isAskingForTFSpotsCount (text) {
        const words = ['puntos', 'flores']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }


    isAskingToTimeoutUser (text) {
        const words = ['timeout', 'expulsar', 'castigar']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingToBanUser (text) {
        const words = ['ban', 'ejecutar', 'fusilar', 'exterminar', 'matar', 'aniquilar', 'liquidar', 'ajusticiar']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingTOUnbanUser (text) {
        const words = ['unban', 'indultar', 'perdonar', 'condonar', 'amnistiar', 'eximir', 'absolver']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingUpdateBansList(text) {
        return text.toLowerCase().startsWith('!updatebans')
    }

    isAskingBans(text) {
        return text.toLowerCase().startsWith('!bans')
    }

    isAskingLastTimeouts(text) {
        return text.toLowerCase().startsWith('!timeouts')
    }

    isAskingUnbanRoulette(text) {
        return text.toLowerCase().startsWith('!ruletasuerte')
    }

    isAskingTimeoutRoulette(text) {
        return text.toLowerCase().startsWith('!ruletarusa')
    }

    isAskingToSetTitle (text) {
        return text.toLowerCase().startsWith('!titulo')
    }

    isAskingToSetGame (text) {
        return text.toLowerCase().startsWith('!categoria')
    }

    isAskingForTarracoMangaEvent (text) {
        const words = ['tarraco', 'tarracomanga', 'tarragona']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingBotOpenAI (text) {
        return text.toLowerCase().includes(config.twitch.username)
    }

    isAskingOpenAI (text) {
        return text.toLowerCase().startsWith('!chat')
    }
}

module.exports = InputParser
