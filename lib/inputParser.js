class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dice')
    }
}

module.exports = InputParser
