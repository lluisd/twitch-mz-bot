class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dados')
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
        return text.toLowerCase().startsWith('!restartfoto')
    }
}

module.exports = InputParser
