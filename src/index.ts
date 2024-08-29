
const space = (str: string, idx: number = 0) => {
    let i = idx
    let space: RegExpMatchArray | null = null
    for (; i < str.length; i++) {
        const match = str.slice(idx, i + 1).match(/^(\s+)$/)
        if (!match) break
        space = match
    }
    if (!space) return null
    return { type: "space", value: space[1], idx: i } as const
}

const _null = (str: string, idx: number = 0) => {
    let i = idx
    const firstWord = word(str, i)
    if (!firstWord || firstWord.value != "null") return null
    i = firstWord.idx

    return {
        type: "null",
        value: null,
        idx: i
    } as const
}

const boolean = (str: string, idx: number = 0) => {
    let i = idx
    const firstWord = word(str, i)
    if (!firstWord || !["true", "false"].includes(firstWord.value)) return null
    i = firstWord.idx

    return {
        type: "boolean",
        value: firstWord.value == "true",
        idx: i
    } as const
}

const number = (str: string, idx: number = 0) => {
    let i = idx, number = '', sign = '+'
    if (str.charAt(i) == '-') sign = '-', i++
    for (; i < str.length; i++) {
        const char = str.charAt(i)
        if (/\d/.test(char) || number && !number.includes('.') && char == '.')
            number += char
        else break
    }
    if (!number || number.endsWith('.')) return null
    return { type: "number", value: Number(sign + number), idx: i } as const
}

const string = (str: string, idx: number = 0) => {
    let i = idx

    if (str.charAt(i) != '"') return null; i++
    let string = "", char = str[i], escaped = false
    for (; i < str.length; i++, char = str[i]) {
        if (escaped || !['"', "\\"].includes(str[i])) {
            string += (escaped ? "\\" : '') + char
            escaped = false
        }
        else if (char == "\\") {
            escaped = true
        }
        else if (!escaped && char == '"') { i++; break }
    }
    if (escaped || char != '"') return null;
    return { type: "string", value: string, idx: i }
}

const word = (str: string, idx: number = 0) => {
    let i = idx
    let word: RegExpMatchArray | null = null
    for (; i < str.length; i++) {
        const match = str.slice(idx, i + 1).match(/^([a-zA-Z_][a-zA-Z0-9_]*)$/)
        if (!match) break
        word = match
    }
    if (!word) return null
    return { type: "word", value: word[1], idx: i } as const
}

const name = (str: string, idx: number = 0) => {
    let i = idx
    const firstWord = word(str, i)
    const words: { value: string, isArray: boolean }[] = []
    if (!firstWord) return null
    i = firstWord.idx

    let currentWord = { value: firstWord.value, isArray: false }
    words.push(currentWord)

    while (true) {
        if (str.slice(i, i + 2) == "[]") i += 2, currentWord.isArray = true
        if (str[i] == '.') i++; else break

        const nextWord = word(str, i)
        if (!nextWord) return null
        i = nextWord.idx
        words.push(currentWord = { value: nextWord.value, isArray: false })
    }

    return {
        type: "name",
        idx: i,
        words,
    } as const
}

const list = (str: string, idx: number = 0) => {
    let i = idx
    const list: NonNullable<ReturnType<typeof term>>[] = []
    if (str[i] != "[") return null; i++

    const firstSpace = space(str, i)
    if (firstSpace) i = firstSpace.idx

    const firstTerm = term(str, i)
    if (firstTerm !== null) {
        i = firstTerm.idx
        list.push(firstTerm)
    }

    while (firstTerm !== null) {
        const nextSpace = space(str, i)
        if (nextSpace) i = nextSpace.idx

        if (str[i] != ",") break; i++

        const lastSpace = space(str, i)
        if (lastSpace) i = lastSpace.idx

        const lastTerm = term(str, i)
        if (lastTerm === null) break
        i = lastTerm.idx

        list.push(lastTerm)
    }

    const lastSpace = space(str, i)
    if (lastSpace) i = lastSpace.idx

    if (str[i] != "]") return null; i++

    return {
        type: "list",
        value: list,
        idx: i,
    } as const
}

const group = (str: string, idx: number = 0) => {
    let i = idx
    if (str[i] != "(") return null; i++

    const firstSpace = space(str, i)
    if (firstSpace) i = firstSpace.idx

    const expr = expr2(str, i)
    if (!expr) return null
    i = expr.idx

    const lastSpace = space(str, i)
    if (lastSpace) i = lastSpace.idx

    if (str[i] != ")") return null; i++

    return {
        type: "group",
        value: expr,
        idx: i,
    } as const
}

const term = (str: string, idx: number = 0) => {
    let i = idx
    const termFns = [group as any, list, _null, boolean, number, string, name]
    let term: ReturnType<typeof termFns[number]> | null = null

    for (const termFn of termFns) {
        term = termFn(str, i)
        if (term) break
    }

    if (!term) return null
    i = term.idx

    return { type: "term", value: term, idx: i } as const
}

const prefix = (str: string, idx: number = 0) => {
    const operators = ["not"]

    const id = word(str, idx)
    if (!id) return null

    const value = operators.find(x => x == id.value)
    if (!value) return null

    return {
        type: "prefix",
        idx: id.idx,
        value,
    } as const
}

const infix0 = (str: string, idx: number = 0) => {
    const operators = [
        "lte", "gte", "lt", "gt", "eq", "in",
        "notin", "noteq", "has", "begins", "ends"
    ]

    const id = word(str, idx)
    if (!id) return null

    const value = operators.find(x => x == id.value)
    if (!value) return null

    return {
        type: "infix0",
        idx: id.idx,
        value,
    } as const
}

const infix1 = (str: string, idx: number = 0) => {
    const operators = ["and"]

    const id = word(str, idx)
    if (!id) return null

    const value = operators.find(x => x == id.value)
    if (!value) return null

    return {
        type: "infix1",
        idx: id.idx,
        value,
    } as const
}

const infix2 = (str: string, idx: number = 0) => {
    const operators = ["or"]

    const id = word(str, idx)
    if (!id) return null

    const value = operators.find(x => x == id.value)
    if (!value) return null

    return {
        type: "infix2",
        idx: id.idx,
        value,
    } as const
}

const expr0 = (str: string, idx: number = 0) => {
    let i = idx
    const firstPrefix = prefix(str, i)

    if (firstPrefix) {
        i = firstPrefix.idx
        const firstSpace = space(str, i)
        if (firstSpace) i = firstSpace.idx
    }

    const firstTerm = term(str, i)
    if (!firstTerm) return null
    i = firstTerm.idx

    let left:
        | Infix0Operation
        | PrefixOperation
        | NonNullable<ReturnType<typeof term>>
        = !firstPrefix ? firstTerm : {
            type: "prefix-operation",
            operator: firstPrefix,
            operand: firstTerm,
            idx: i
        } as const

    while (true) {
        const nextSpace = space(str, i)
        if (nextSpace) i = nextSpace.idx

        const nextInfix0 = infix0(str, i)
        if (!nextInfix0) break
        i = nextInfix0.idx

        const lastSpace = space(str, i)
        if (lastSpace) i = lastSpace.idx

        const nextPrefix = prefix(str, i)
        if (nextPrefix) {
            i = nextPrefix.idx
            const lastSpace = space(str, i)
            if (lastSpace) i = lastSpace.idx
        }

        const nextTerm = term(str, i)
        if (!nextTerm) return null
        i = nextTerm.idx

        const right = !nextPrefix ? nextTerm : {
            type: "prefix-operation",
            operator: nextPrefix,
            operand: nextTerm,
            idx: i
        } as const

        left = {
            type: "infix0-operation",
            operator: nextInfix0,
            idx: i,
            left,
            right,
        } as const
    }

    return left
}

const expr1 = (str: string, idx: number = 0) => {
    let i = idx
    const firstExpr0 = expr0(str, i)
    if (!firstExpr0) return null
    i = firstExpr0.idx

    let left:
        | Infix1Operation
        | NonNullable<ReturnType<typeof expr0>> = firstExpr0

    while (true) {
        const nextSpace = space(str, i)
        if (nextSpace) i = nextSpace.idx

        const nextInfix1 = infix1(str, i)
        if (!nextInfix1) break
        i = nextInfix1.idx

        const lastSpace = space(str, i)
        if (lastSpace) i = lastSpace.idx

        const nextExpr0 = expr0(str, i)
        if (!nextExpr0) return null
        i = nextExpr0.idx

        left = {
            type: "infix1-operation",
            operator: nextInfix1,
            idx: i,
            left,
            right: nextExpr0,
        } as const
    }

    return left
}

const expr2 = (str: string, idx: number = 0) => {
    let i = idx
    const firstExpr1 = expr1(str, i)
    if (!firstExpr1) return null
    i = firstExpr1.idx

    let left:
        | Infix2Operation
        | NonNullable<ReturnType<typeof expr1>> = firstExpr1

    while (true) {
        const nextSpace = space(str, i)
        if (nextSpace) i = nextSpace.idx

        const nextInfix2 = infix2(str, i)
        if (!nextInfix2) break
        i = nextInfix2.idx

        const lastSpace = space(str, i)
        if (lastSpace) i = lastSpace.idx

        const nextExpr1 = expr1(str, i)
        if (!nextExpr1) return null
        i = nextExpr1.idx

        left = {
            type: "infix2-operation",
            operator: nextInfix2,
            idx: i,
            left,
            right: nextExpr1,
        } as const
    }

    return left
}

export const parse = {
    space,
    null: _null,
    boolean,
    number,
    string,
    word,
    name,
    term,
    list,
    group,
    prefix,
    infix0,
    infix1,
    infix2,
    expr0,
    expr1,
    expr2,
}

export type PrefixOperation = {
    type: "prefix-operation",
    operator: NonNullable<ReturnType<typeof prefix>>,
    operand: NonNullable<ReturnType<typeof term>>,
    idx: number
}

export type Infix0Operation = {
    type: "infix0-operation",
    operator: NonNullable<ReturnType<typeof infix0>>,
    left: Infix0Operation | PrefixOperation | NonNullable<ReturnType<typeof term>>,
    right: PrefixOperation | NonNullable<ReturnType<typeof term>>,
    idx: number
}

export type Infix1Operation = {
    type: "infix1-operation",
    operator: NonNullable<ReturnType<typeof infix1>>,
    left: Infix1Operation | NonNullable<ReturnType<typeof expr0>>,
    right: NonNullable<ReturnType<typeof expr0>>,
    idx: number
}

export type Infix2Operation = {
    type: "infix2-operation",
    operator: NonNullable<ReturnType<typeof infix2>>,
    left: Infix2Operation | NonNullable<ReturnType<typeof expr1>>,
    right: NonNullable<ReturnType<typeof expr1>>,
    idx: number
}