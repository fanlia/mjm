
const fs = require('fs')
const parse = require('.')

const source = fs.readFileSync('mckeeman.grammar', 'utf8')

const result = parse(source)
const resultStr = JSON.stringify(result, null, 2)

const expected = fs.readFileSync('mckeeman.json', 'utf8')
const passed = expected === resultStr
console.log({passed})

