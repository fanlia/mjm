
const grammar = {
    type: 'and',
    predict: () => ([
        whitespace,
        rules,
    ]),
    fn: true,
    format: (d) => d[1],
}

const space = {
    type: 'chars',
    predict: () => ([' ']),
    fn: true,
}

const newline = {
    type: 'chars',
    predict: () => (['\n']),
    fn: true,
}

const name = {
    type: 'many',
    predict: () => letter,
    fn: true,
    format: d => ({name: d.join('')}),
}

const letter = {
    type: 'char',
    predict: () => ch => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_',
    fn: true,
}

const indentation = {
    type: 'and',
    predict: () => ([
        space,
        space,
        space,
        space,
    ]),
    fn: true,
}

const rules = {
    type: 'until',
    predict: () => ({
        predict: rule,
        hasNextPredict: newline,
    }),
    fn: true,
}

const rule = {
    type: 'and',
    predict: () => ([
        name,
        newline,
        nothing,
        alternatives,
    ]),
    fn: true,
    format: ([name, newline, nothing, alternatives]) => ({name: name.name, nothing: nothing.ok, alternatives}),
}

const nothing = {
    type: 'maybe',
    predict: () => ({
        type: 'and',
        predict: [
            indentation,
            {
                type: 'chars',
                predict: ['"'],
            },
            {
                type: 'chars',
                predict: ['"'],
            },
            newline,
        ],
    }),
    fn: true,
}

const alternatives = {
    type: 'many',
    predict: () => alternative,
    fn: true,
}

const alternative = {
    type: 'and',
    predict: () => ([
        indentation,
        items,
        newline,
    ]),
    fn: true,
    format: ([indentation, items, newline]) => items,
}

const items = {
    type: 'until',
    predict: () => ({
        predict: item,
        hasNextPredict: space,
    }),
    fn: true,
}

const item = {
    type: 'or',
    predict: () => ([
        literal,
        name,
    ]),
    fn: true,
}

const literal = {
    type: 'or',
    predict: () => ([
        {
            type: 'and',
            predict: [
                range,
                exclude,
            ],
            format: ([range, exclude]) => ({range, exclude: exclude.data})
        },
        singleton,
        {
            type: 'and',
            predict: [
                {
                    type: 'chars',
                    predict: ['"'],
                },
                characters,
                {
                    type: 'chars',
                    predict: ['"'],
                },
            ],
            format: d => ({characters: d[1].join('')}),
        },
    ]),
    fn: true,
}

const singleton = {
    type: 'and',
    predict: () => ([
        {
            type: 'chars',
            predict: ['\''],
        },
        codepoint,
        {
            type: 'chars',
            predict: ['\''],
        },
    ]),
    fn: true,
    format: d => ({singleton: d[1]}),
}

const codepoint = {
    type: 'or',
    predict: () => ([
        hexcode,
        {
            type: 'char',
            predict: ch => ch >= ' ' && ch.codePointAt(0) <= 0x10FFFF,
            format: ch => ({char: ch}),
        },
    ]),
    fn: true,
}

const hexcode = {
    type: 'or',
    predict: () => ([
        {
            type: 'and',
            predict: [
                {
                    type: 'chars',
                    predict: ['1', '0'],
                },
                hex,
                hex,
                hex,
                hex,
            ],
        },
        {
            type: 'and',
            predict: [
                hex,
                hex,
                hex,
                hex,
                hex,
            ],
        },
        {
            type: 'and',
            predict: [
                hex,
                hex,
                hex,
                hex,
            ],
        },
    ]),
    fn: true,
    format: d => ({hexcode: [].concat(...d).join('')}),
}

const hex = {
    type: 'char',
    predict: () => ch => (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z'),
    fn: true,
}

const range = {
    type: 'and',
    predict: () => ([
        singleton,
        space,
        {
            type: 'chars',
            predict: ['.'],
        },
        space,
        singleton,
    ]),
    fn: true,
    format: ([start, s1, dot, s2, end]) => ({start: start.singleton, end: end.singleton})
}

const exclude = {
    type: 'maybe',
    predict: () => ({
        type: 'many',
        predict: {
            type: 'or',
            predict: [
                {
                    type: 'and',
                    predict: [
                        space,
                        {
                            type: 'chars',
                            predict: ['-'],
                        },
                        space,
                        range,
                    ],
                },
                {
                    type: 'and',
                    predict: [
                        space,
                        {
                            type: 'chars',
                            predict: ['-'],
                        },
                        space,
                        singleton,
                    ],
                },
            ],
            format: d => d[3],
        },
    }),
    fn: true,
}

const characters = {
    type: 'many',
    predict: () => character,
    fn: true,
}

const character = {
    type: 'char',
    predict: () => ch => (ch >= ' ' && ch.codePointAt(0) <= 0x10FFFF) && (ch !== '"'),
    fn: true,
}

const whitespace = {
    type: 'maybe',
    predict: {
        type: 'many',
        predict: {
            type: 'char',
            predict: ch => /\s/.test(ch),
        },
    },
}

module.exports = grammar

