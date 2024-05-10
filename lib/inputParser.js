class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dados')
    }

    isAskingForOF (text) {
        return text.toLowerCase().startsWith('!of') || text.toLowerCase().startsWith('!only')
    }

    isAskingForSunset (text) {
        return text.startsWith('!atardecer')
    }

    isAskingForSunrise (text) {
        return text.startsWith('!amanecer')
    }

    isAskingForNextMDTrain (text) {
        return text.toLowerCase().startsWith('!md')
    }

    isAskingForNextAveTrain (text) {
        return text.toLowerCase().startsWith('!ave')
    }

    isAskingForTakeScreenshot (text) {
        return text.toLowerCase().startsWith('!foto')
    }

    isAskingForF5 (text) {
        return text.toLowerCase().startsWith('!f5')
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

    isAskingForPendingUnbanRequests (text) {
        return text.toLowerCase().startsWith('!bans')
    }

    isAskingForTFVisited (text) {
        return text.toLowerCase().startsWith('!visto')
    }

    isAskingForTFNotVisited (text) {
        return text.toLowerCase().startsWith('!novisto')
    }

    isAskingForTFActiveSpot(text) {
        return text.toLowerCase().startsWith('!activo')
    }

    isAskingForTFSpot (text) {
        return text.toLowerCase().startsWith('!punto')
    }

    isAskingForTFScreenshot (text) {
        return text.toLowerCase().startsWith('!foto')
    }

    isAskingForTFSpotsCount (text) {
        return text.toLowerCase().startsWith('!info')
    }

    isAskingForTFMap (text) {
        return text.toLowerCase().startsWith('!mapa')
    }

    isAskingForTFHelp (text) {
        return text.toLowerCase().startsWith('!ayuda')
    }
}

module.exports = InputParser
