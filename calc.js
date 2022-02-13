
const parse = require('./parse')

const source = `
start
    additive

additive
    multiplicative '+' additive
    multiplicative

multiplicative
    primary '*' multiplicative
    primary

primary
    integer
    '(' additive ')'

integer
    digit
    digit integer

digit
    '0' . '9'

`

const start = {
    type: "or",
    predict: () => ([
        additive,
    ]),
    fn: true,
}

const additive = {
    type: 'or',
    predict: () => ([
        {
            type: 'and',
            predict: [
                multiplicative,
                {
                    type: 'char',
                    predict: ch => ch === '+',
                },
                additive,
            ],
        },
        multiplicative,
    ]),
    fn: true,
}

const multiplicative = {
    type: 'or',
    predict: () => ([
        {
            type: 'and',
            predict: [
                primary,
                {
                    type: 'char',
                    predict: ch => ch === '*',
                },
                multiplicative,
            ],
        },
        primary,
    ]),
    fn: true,
}

const primary = {
    type: 'or',
    predict: () => ([
        {
            type: 'and',
            predict: [
                {
                    type: 'chars',
                    predict: ['('],
                },
                additive,
                {
                    type: 'chars',
                    predict: [')'],
                },
            ],
        },
        integer,
    ]),
    fn: true,
}

const integer = {
    type: 'many',
    predict: () => ({
        type: 'char',
        predict: ch => ch >= '0' && ch <= '9',
    }),
    fn: true,
}

console.log(JSON.stringify(parse('2*(3+4)', start), null, 2))
