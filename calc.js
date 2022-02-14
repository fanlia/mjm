
const parse = require('./parse')
const mjm = require('.')

const source = `
start
    additive

additive
    multiplicative '+' additive
    multiplicative

multiplicative
    primary '*' multiplicative
    primary

primary
    integer
    '(' additive ')'

integer
    digit
    digit integer

digit
    '0' . '9'

`

const script = mjm.stringify(source)

console.log(script)

const start = new Function(`let module = {}\n${script}\nreturn module.exports`)()

console.log(JSON.stringify(parse('2*((3+4)+7)', start), null, 2))
