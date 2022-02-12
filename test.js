
const parse = require('.')

const source = `
grammar
    rules

space
    '0020'

newline
    '000A'

name
    letter
    letter name

letter
    'a' . 'z'
    'A' . 'Z'
    '_'

indentation
    space space space space

rules
    rule
    rule newline rules

rule
    name newline nothing alternatives

nothing
    ""
    indentation '"' '"' newline

alternatives
    alternative
    alternative alternatives

alternative
    indentation items newline

items
    item
    item space items

item
    literal
    name

literal
    singleton
    range exclude
    '"' characters '"'

singleton
    ''' codepoint '''

codepoint
    ' ' . '10FFFF'
    hexcode

hexcode
    "10" hex hex hex hex
    hex hex hex hex hex
    hex hex hex hex

hex
    '0' . '9'
    'A' . 'F'

range
    singleton space '.' space singleton

exclude
    ""
    space '-' space singleton exclude
    space '-' space range exclude

characters
    character
    character characters

character
    ' ' . '10FFFF' - '"'

`
const result = parse(source)

console.log(JSON.stringify(result, null, 2))
