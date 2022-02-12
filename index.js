
class Parser {
    constructor (source) {
        this.source = source
        this.index = 0
    }

    peek () {
        return this.source[this.index]
    }

    next () {
        if (this.index < this.source.length) {
            this.index++
        } else {
            throw new Error('unexpected end')
        }
    }

    char (predict) {
        const ch = this.peek()
        if (predict(ch)) {
            this.next()
            return { ok: true, data: ch }
        } else {
            return { ok: false, data: ch }
        }
    }

    chars (char_array) {
        const predicts = char_array.map(char => ({
            type: 'char',
            predict: ch => ch === char,

        }))
        return this.and(predicts)
    }

    any (option) {
        if (!option && typeof option !== 'object') {
            throw new Error('invalid parse option')
        }
        let {type, predict, fn, format} = option
        if (!type) {
            throw new Error('parse type required')
        }
        if (!predict) {
            throw new Error('parse predict required')
        }

        const index = this.index
        let result = null

        if (fn) {
            predict = predict()
        }

        if (type === 'char') {
            result = this.char(predict)
        } else if (type === 'chars') {
            result = this.chars(predict)
        } else if (type === 'limit') {
            result = this.limit(predict)
        } else if (type === 'many') {
            result = this.many(predict)
        } else if (type === 'until') {
            result = this.until(predict)
        } else if (type === 'maybe') {
            result = this.maybe(predict)
        } else if (type === 'and') {
            result = this.and(predict)
        } else if (type === 'or') {
            result = this.or(predict)
        }

        if (!result) {
            throw new Error(`not implemented predict type: ${type}`)
        }

        if (!result.ok) {
            this.index = index
        } else if (typeof format === 'function' && result.data) {
            result.data = format(result.data)
        }

        return result
    }

    limit ({ predict, len }) {
        const results = []

        for (let i = 0; i < len; i++) {
            const result = this.any(predict)
            if (!result.ok) break
            results.push(result.data)
        }

        return { ok: results.length === len, data: results }
    }

    many (predict) {
        const results = []

        while (true) {
            const result = this.any(predict)
            if (!result.ok) break
            results.push(result.data)
        }

        return { ok: results.length > 0, data: results }
    }

    until ({predict, hasNextPredict}) {
        const results = []

        while (true) {
            const result = this.any(predict)
            if (!result.ok) break
            results.push(result.data)
            const hasNext = this.any(hasNextPredict)
            if (!hasNext.ok) break
        }

        return { ok: results.length > 0, data: results }
    }

    maybe (predict) {
        return {
            ok: true,
            data: this.any(predict),
        }
    }

    and (predicts) {

        const results = []

        for (const predict of predicts) {
            const result = this.any(predict)
            if (!result.ok) {
                return { ok: false, data: results }
            }

            results.push(result.data)
        }

        return { ok: results.length > 0, data: results }
    }

    or (predicts) {

        for (const predict of predicts) {
            const result = this.any(predict)
            if (!result.ok) continue

            return result
        }

        return { ok: false, data: null }
    }

    parse (predict) {
        const result = this.any(predict)

        return {
            result,
            index: this.index,
            length: this.source.length,
        }
    }
}

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
    format: ([name, newline, nothing, alternatives]) => ({name, nothing: nothing.ok, alternatives}),
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

const parse = (source) => {
    const parser = new Parser(source)
    const result = parser.parse(grammar)
    return result
}

module.exports = parse

