class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dados')
    }

    isAskingForSunset (text) {
        return text.startsWith('!sunset') || text.startsWith('!ocaso') || text.startsWith('!atardecer')
    }

    isAskingForNextMDTrain (text) {
        return text.toLowerCase().startsWith('!md')
    }

    isAskingForNextAveTrain (text) {
        return text.toLowerCase().startsWith('!ave')
    }
}

module.exports = InputParser
