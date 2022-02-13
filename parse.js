
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
        let {type, predict, format} = option
        if (!type) {
            throw new Error('parse type required')
        }
        if (!predict) {
            throw new Error('parse predict required')
        }

        const index = this.index
        let result = null

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

const parse = (source, grammar) => {
    const parser = new Parser(source)
    const result = parser.parse(grammar)
    return result
}

module.exports = parse

