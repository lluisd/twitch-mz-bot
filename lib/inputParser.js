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

    isAskingForTFCommands (text) {
        return text.toLowerCase().startsWith('!comandos')
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
        const words = ['visto', 'visitado', 'visitada', 'vista', 'visitar']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForTFDelete (text) {
        const words = ['borrar', 'eliminar', 'borra', 'elimina']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
    }

    isAskingForTFActiveSpot(text) {
        const words = ['activo', 'activa', 'activar']
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

    isAskingUpdateBlocksList(text) {
        return text.toLowerCase().startsWith('!updateblocks')
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

    isAskingSetStrike(text) {
        return text.toLowerCase().startsWith('!strike')
    }

    isAskingToAddVip(text) {
        return text.toLowerCase().startsWith('!vip')
    }

    isAskingToRemoveVip(text) {
        const words = ['unvip', 'nosvip']
        return words.some(word => text.toLowerCase().startsWith(`!${word}`))
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

    isAskingToUploadChatToOpenAI (text) {
        return text.toLowerCase().startsWith('!updatechat')
    }

    isAskingToUploadStreamToOpenAI (text) {
        return text.toLowerCase().startsWith('!updatestream')
    }

    isAskingToUnbanAll (text) {
        return text.toLowerCase().startsWith('!unbanall')
    }
}

module.exports = InputParser
