
const space = {
    type: 'chars',
    predict: [' '],
}

const newline = {
    type: 'chars',
    predict: ['\n'],
}

const letter = {
    type: 'char',
    predict: ch => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_',
}

const indentation = {
    type: 'and',
    predict: [
        space,
        space,
        space,
        space,
    ],
}

const character = {
    type: 'char',
    predict: ch => (ch >= ' ' && ch.codePointAt(0) <= 0x10FFFF) && (ch !== '"'),
}

const characters = {
    type: 'many',
    predict: character,
}

const hex = {
    type: 'char',
    predict: ch => (ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'Z'),
}

const hexcode = {
    type: 'or',
    predict: [
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
    ],
    format: d => ({hexcode: [].concat(...d).join('')}),
}

const codepoint = {
    type: 'or',
    predict: [
        hexcode,
        {
            type: 'char',
            predict: ch => ch >= ' ' && ch.codePointAt(0) <= 0x10FFFF,
            format: ch => ({char: ch}),
        },
    ],
}

const singleton = {
    type: 'and',
    predict: [
        {
            type: 'chars',
            predict: ['\''],
        },
        codepoint,
        {
            type: 'chars',
            predict: ['\''],
        },
    ],
    format: d => ({singleton: d[1]}),
}

const range = {
    type: 'and',
    predict: [
        singleton,
        space,
        {
            type: 'chars',
            predict: ['.'],
        },
        space,
        singleton,
    ],
    format: ([start, s1, dot, s2, end]) => ({start: start.singleton, end: end.singleton})
}

const exclude = {
    type: 'maybe',
    predict: {
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
    },
}

const literal = {
    type: 'or',
    predict: [
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
    ],
}

const name = {
    type: 'many',
    predict: letter,
    format: d => ({name: d.join('')}),
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

const nothing = {
    type: 'maybe',
    predict: {
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
    },
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
            predict: ch => !letter.predict(ch),
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

