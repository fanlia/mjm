
const parse = require('./parse')
const stringify = require('./stringify')

const mckeeman = require('./mckeeman')

exports.parse = (source) => {
    return parse(source, mckeeman)
}

exports.stringify = (source) => {
    const result = exports.parse(source)
    return stringify(result.result)
}

