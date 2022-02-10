
const parse = require('.')

const source = `
name
    letter
    letter name

letter
    'a' . 'z'
    'A' . 'Z'
    '_'

singleton
    ''' codepoint '''

characters
    character
    character characters

character
    ' ' . '10FFFF' - '"' - 'x' . 'f'

`
const result = parse(source)

console.log(JSON.stringify(result, null, 2))
