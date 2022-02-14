
const stringifySingleton = (singleton, op) => {
    if (singleton.char) {
        const char = singleton.char === '\'' ? '\\\'' : singleton.char
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
        return item.name
    } else if (item.characters) {
        return  `{type: 'chars', predict: [${item.characters.split('').map(d => `'${d}'`).join(',')}]}`
    } else if (item.singleton) {
        const fnpart = stringifySingleton(item.singleton, '===')
        return `{type: 'char', predict: ch => ${fnpart}}`
    } else if (item.range) {
        let fnpart = stringifyRange(item.range)
        if (item.exclude && item.exclude.length > 0) {
            fnpart += ` && !(${item.exclude.map(d => `(${stringifyExclude(d)})`).join(' || ')})`
        }
        return `{type: 'char', predict: ch => ${fnpart}}`
    } else {
        throw new Error('not implemented item type')
    }
}

const stringifyAlternative = (items) => {
    const results = items.map(stringifyItem)

    const space12 = ' '.repeat(12)
    const space8 = ' '.repeat(8)
    const space16 = ' '.repeat(16)

    if (results.length === 1) {
        return results[0]
    }

    return `{\n${space12}type: "and",\n${space12}predict: [\n${space16}${results.join(`,\n${space16}`)},\n${space12}],\n${space8}}`
}

const stringifyRule = (rule) => {

    let { name, nothing, alternatives } = rule

    alternatives = alternatives.sort((a, b) => b.length - a.length)
    const noName = alternatives.every(alternative => alternative.every(item => item.name === undefined))

    const space4 = ' '.repeat(4)
    const space8 = ' '.repeat(8)

    let script = `const ${name} = `

    let body = null

    let results = alternatives.map(stringifyAlternative)


    if (noName) {
        if (results.length === 1) {
            body = results[0]
        } else {
            body = `{\n${space4}type: "or",\n${space4}predict: [\n${space4}${results.map(d => `${space4}${d}`).join(`,\n${space4}`)},\n${space4}],\n}`

        }
    } else {

        if (results.length === 1) {
            const converted = results[0]
                .replace(/ {16,16}/g, space8)
                .replace(/ {12,12}/g, space4)
                .replace(/ {8,8}\}/, '}')
                .replace(/predict: \[/, 'predict: () => ([')
                .replace(/],\n}$/, `]),\n${space4}fn: true,\n}`)

            body = `${converted}`
        } else {
            body = `{\n${space4}type: "or",\n${space4}predict: () => ([\n${space4}${results.map(d => `${space4}${d}`).join(`,\n${space4}`)},\n${space4}]),\n${space4}fn: true,\n}`

        }
    }

    if (!body) {
        throw new Error('not implemented stringify logic')
    }

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
