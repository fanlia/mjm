
const stringifySingleton = (singleton, op) => {
    if (singleton.char) {
        let char = singleton.char
        if (char === '\'') {
            char = '\\\''
        } else if (char === '\\') {
            char = '\\\\'
        }
        return `ch ${op} '${char}'`
    } else if (singleton.hexcode) {
        return `ch.codePointAt(0) ${op} 0x${singleton.hexcode}`
    } else {
        throw new Error('not implemented singleton type')
    }
}

const stringifyRange = (range) => {
    return `${stringifySingleton(range.start, '>=')} && ${stringifySingleton(range.end, '<=')}`
}

const stringifyExclude = (exclude) => {
    if (exclude.singleton) {
        return stringifySingleton(exclude.singleton, '===')
    } else if (exclude.range) {
        return stringifyRange(exclude.range)
    } else {
        throw new Error('not implemented exclude type')
    }
}

const stringifyItem = (item) => {
    if (item.name) {
        return { type: 'name', data: item.name }
    } else if (item.characters) {
        const data = `{type: 'chars', predict: [${item.characters.split('').map(d => `'${d}'`).join(',')}]}`
        return { type: 'characters', data }
    } else if (item.singleton) {
        const fnpart = stringifySingleton(item.singleton, '===')
        const data = `{type: 'char', predict: ch => ${fnpart}}`
        return { type: 'singleton', data }
    } else if (item.range) {
        let fnpart = stringifyRange(item.range)
        if (item.exclude && item.exclude.length > 0) {
            fnpart += ` && !(${item.exclude.map(d => `(${stringifyExclude(d)})`).join(' || ')})`
        }
        const data = `{type: 'char', predict: ch => ${fnpart}}`
        return { type: 'range', data }
    } else {
        throw new Error('not implemented item type')
    }
}

const space4 = ' '.repeat(4)
const space8 = ' '.repeat(8)
const space12 = ' '.repeat(12)
const space16 = ' '.repeat(16)

const stringifyAlternatives = (alternatives) => {
    const hasName = alternatives.some(items => items.some(item => item.type === 'name'))
    if (alternatives.length === 1) {
        const items = alternatives[0]
        if (items.length === 1 && !hasName) {
            return alternatives[0][0].data
        }
        const andPredict = items.map(item => item.data).join(`,\n${space8}`)
        if (hasName) {
            return `{\n${space4}type: "and",\n${space4}predict: () => ([\n${space8}${andPredict},\n${space4}]),\n${space4}fn: true,\n}`
        } else {
            return `{\n${space4}type: "and",\n${space4}predict: [\n${space8}${andPredict},\n${space4}],\n}`
        }
    }
    const orPredict = alternatives
    .map(items => {
        if (items.length === 1) {
            return `${space8}${items[0].data}`
        }
        const andPredict = items.map(item => item.data).join(`,\n${space16}`)
        return `${space8}{\n${space12}type: "and",\n${space12}predict: [\n${space16}${andPredict},\n${space12}],\n${space8}}`
    })
    .join(',\n')

    if (hasName) {
        return `{\n${space4}type: "or",\n${space4}predict: () => ([\n${orPredict},\n${space4}]),\n${space4}fn: true,\n}`
    } else {
        return `{\n${space4}type: "or",\n${space4}predict: [\n${orPredict},\n${space4}],\n}`
    }
}

const stringifyRule = (rule) => {

    let { name, nothing, alternatives } = rule

    alternatives = alternatives.sort((a, b) => b.length - a.length).map(alternative => alternative.map(stringifyItem))

    let script = `const ${name} = `

    let body = stringifyAlternatives(alternatives)

    if (nothing) {
        body = `{type: 'maybe', predict: ${body}}`
    }

    return `${script}${body}`
}

const whitespace = `
const whitespace = {type: 'maybe', predict: {
    type: 'many',
    predict: {
        type: 'char',
        predict: ch => /\\s/.test(ch),
    },
}}
`

const stringify = (result) => {
    if (!result.ok) return

    result.data[0].alternatives.forEach(d => d.unshift({
        name: 'whitespace',
    }))

    const results = result.data.map(stringifyRule)

    return `
${results.join('\n\n')}
${whitespace}
module.exports = ${result.data[0].name}
`
}

module.exports = stringify
