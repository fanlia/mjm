
const parse = require('./parse')

const mckeeman = require('./mckeeman')

module.exports = (source) => {
    return parse(source, mckeeman)
}

