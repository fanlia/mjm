
const SPACE = '\u0020'
const NEWLINE = '\u000A'
const SINGLE_QUOTE = '\''
const DOUBLE_QUOTE = '"'
const DOT = '.'

function isLetter (ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'
}

function isHex (ch) {
    return (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z')
}

const letter = {
    type: 'char',
    predict: isLetter,
}

const name = {
    type: 'many',
    predict: letter,
    format: d => ({name: d.join('')}),
}

const indentation = {
    type: 'chars',
    predict: [
        SPACE, SPACE, SPACE, SPACE,
    ],
}

const nothing = {
    type: 'maybe',
    predict: {
        type: 'chars',
        predict: [
            SPACE, SPACE, SPACE, SPACE,
            DOUBLE_QUOTE, DOUBLE_QUOTE,
            NEWLINE,
        ],
    },
}

const space = {
    type: 'chars',
    predict: [SPACE],
}

const newline = {
    type: 'chars',
    predict: [NEWLINE],
}

const dot = {
    type: 'chars',
    predict: [DOT],
}

const hex = {
    type: 'char',
    predict: isHex,
}

const single_quote = {
    type: 'chars',
    predict: [SINGLE_QUOTE],
}

const double_quote = {
    type: 'chars',
    predict: [DOUBLE_QUOTE],
}

const any_char = {
    type: 'char',
    predict: () => true,
}

const hex4 = {
    type: 'limit',
    predict: {
        predict: hex,
        len: 4,
    },
    format: d => d.join(''),
}

const hex5 = {
    type: 'and',
    predict: [
        hex,
        hex4,
    ],
    format: d => d[0] + d[1],
}

const hex6 = {
    type: 'and',
    predict: [
        {
            type: 'chars',
            predict: ['1', '0'],
            format: d => d.join(''),
        },
        hex4,
    ],
    format: d => d[0] + d[1],
}

const hexcode = {
    type: 'or',
    predict: [
        hex6,
        hex5,
        hex4,
    ],
}

const codepoint = {
    type: 'or',
    predict: [
        hexcode,
        any_char,
    ],
}

const singleton = {
    type: 'and',
    predict: [
        single_quote,
        codepoint,
        single_quote,
    ],
    format: d => ({singleton: d[1]}),
}

const exclude = {
    type: 'and',
    predict: () => ([
        {
            type: 'chars',
            predict: [SPACE, '-', SPACE],
        },
        {
            type: 'or',
            predict: [range, singleton],
        },
    ]),
    fn: true,
    format: d => d[1],
}

const excludes = {
    type: 'maybe',
    predict: {
        type: 'many',
        predict: exclude,
    },
}

const range = {
    type: 'and',
    predict: [
        singleton,
        space,
        dot,
        space,
        singleton,
    ],
    format: ([start, s1, dot, s2, end]) => ({start: start.singleton, end: end.singleton})
}

const characters = {
    type: 'and',
    predict: [
        double_quote,
        {
            type: 'many',
            predict: {
                type: 'char',
                predict: ch => ch !== DOUBLE_QUOTE,
            },
        },
        double_quote,
    ],
    format: d => ({characters: d[1].join('')}),
}

const literal = {
    type: 'or',
    predict: [
        {
            type: 'and',
            predict: [
                range,
                excludes,
            ],
            format: ([range, exclues]) => ({range, exclues: exclues.data})
        },
        singleton,
        characters,
    ],
}

const item = {
    type: 'or',
    predict: [
        literal,
        name,
    ],
}

const items = {
    type: 'until',
    predict: {
        predict: item,
        hasNextPredict: space,
    },
}

const alternative = {
    type: 'and',
    predict: [
        indentation,
        items,
        newline,
    ],
    format: ([indentation, items, newline]) => items,
}

const alternatives = {
    type: 'many',
    predict: alternative,
}

const rule = {
    type: 'and',
    predict: [
        name,
        newline,
        nothing,
        alternatives,
    ],
    format: ([name, newline, nothing, alternatives]) => ({name: name.name, nothing: nothing.ok, alternatives}),
}

const rules = {
    type: 'until',
    predict: {
        predict: rule,
        hasNextPredict: newline,
    },
}

const whitespace = {
    type: 'maybe',
    predict: {
        type: 'many',
        predict: {
            type: 'char',
            predict: ch => !isLetter(ch),
        },
    },
}

const grammar = {
    type: 'and',
    predict: [
        whitespace,
        rules,
    ],
    format: (d) => d[1],
}

module.exports = grammar

