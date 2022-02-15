#!/usr/bin/env node

'use strict';

const path = require('path')

const [_node, name, ...args] = process.argv

const basename = path.basename(name)

const help = `
Usage:
    ${basename} parse xxx.grammar [grammer.js]
    ${basename} stringify xxx.grammar [input] [-file]
    ${basename} test
`

const helpexit = (msg) => {
    if (msg) {
        console.error(msg)
    }
    console.error(help)
    process.exit(1)
}

if (args.length === 0) {
    helpexit()
}

const fs = require('fs')
const mjm = require('.')

const mckeeman = require('./mckeeman')

exports.stringify = (source) => {
    const result = exports.parse(source)
    return stringify(result.result)
}

let [cmd, ...cmdargs] = args

if (cmd === 'parse') {
    let [ grammarFile, grammarJS ] = cmdargs
    if (!grammarFile) {
        helpexit()
    }
    let grammar = mckeeman
    if (grammarJS) {
        grammar = require(grammarJS)
    }
    const source = fs.readFileSync(grammarFile, 'utf8')
    const result = mjm.parse(source, grammar)
    const resultStr = JSON.stringify(result, null, 2)
    console.log(resultStr)

} else if (cmd === 'stringify') {
    let [ grammarFile, input, isFile ] = cmdargs
    if (!grammarFile) {
        helpexit()
    }
    if (input && isFile === '-file') {
        input = fs.readFileSync(input, 'utf8')
    }

    const source = fs.readFileSync(grammarFile, 'utf8')
    const result = mjm.parse(source, mckeeman)
    const script = mjm.stringify(result.result)
    console.log(script)

    if (input) {
        const start = new Function(`let module = {}\n${script}\nreturn module.exports`)()
        console.log(JSON.stringify(mjm.parse(input, start), null, 2))
    }

} else if (cmd === 'test') {
    const source = fs.readFileSync('mckeeman.grammar', 'utf8')

    const result = mjm.parse(source, mckeeman)
    const resultStr = JSON.stringify(result, null, 2)

    const expected = fs.readFileSync('mckeeman.json', 'utf8')
    const passed = expected === resultStr
    console.log({passed})
} else {
    helpexit(`unkown cmd: ${cmd}`)
}


