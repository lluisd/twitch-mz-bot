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
}

module.exports = InputParser
