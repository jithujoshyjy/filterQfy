import { parse } from "./index";

export function createFilter<T extends Prisma>(prisma: T, tableName: keyof T, filterStr: string) {
    const input = filterStr.trim()
    const ast = parse.expr2(input)
    if (!ast || ast.idx < input.length) return
    const filter = transformExpr2(prisma, tableName as any, ast)
    if (!(filter && "_$metadata" in filter)) return
    return removeMetadata(filter)
}

function transformExpr2(prisma: any, tableName: string, ast: ReturnType<typeof parse.expr2>): any {
    if (!ast) return
    switch (ast.type) {
        case "term": return transformTerm(prisma, tableName, ast)
        case "infix0-operation": return transformInfix0Operation(prisma, tableName, ast)
        case "infix1-operation": return transformInfix1Operation(prisma, tableName, ast)
        case "infix2-operation": return transformInfix2Operation(prisma, tableName, ast)
        case "prefix-operation": return transformPrefixOperation(prisma, tableName, ast)
    }
}

function transformTerm(prisma: any, tableName: string, ast: ReturnType<typeof parse.term>): any {
    if (!ast) return
    switch (ast.value.type) {
        case "null":
        case "boolean":
        case "number":
        case "string": return ast.value.value
        case "name": return transformName(prisma, tableName, ast.value)
        case "list": return ast.value.value.map((x: any) => transformTerm(prisma, tableName, x))
        case "group": return transformExpr2(prisma, tableName, ast.value.value)
    }
    return
}

function transformName(prisma: any, tableName: string, ast: any): any {
    if (!ast) return

    let obj: Record<string, any> = {}
    const words = ast.words

    const metadata = {
        type: "name",
        field: {} as any,
        assign(prop: string, value: any) {
            this.field[prop] = value
        },
        path: words.flatMap((x: any) => x.isArray ? ["every", x.value] : x.value) as string[],
    }

    for (let i = words.length - 1; i >= 0; i--) {
        const { value, isArray } = words[i]
        const field = i == words.length - 1 ? metadata.field : obj
        obj = isArray ? { every: { [value]: field } } : { [value]: field }
    }
    obj._$metadata = metadata

    return obj
}

function transformInfix0Operation(prisma: any, tableName: string, ast: any): any {
    if (!ast) return
    const { left, right, operator } = ast

    const lhs = transformExpr2(prisma, tableName, left)

    if (lhs === undefined) return

    const rhs = transformExpr2(prisma, tableName, right)
    if (rhs === undefined) return

    const operators = {
        lt: "lt",
        gt: "gt",
        eq: "equals",
        lte: "lte",
        gte: "gte",
        in: "in",
        noteq: "not",
        notin: "notIn"
    } as any

    const oppositeOperators = {
        lt: "gt",
        gt: "lt",
        eq: "noteq",
        lte: "gte",
        gte: "lte",
        in: "notin",
        noteq: "eq",
        notin: "in"
    } as any

    const isLeftPrimitive = !hasProp(lhs, '_$metadata') || lhs === null || Array.isArray(lhs)
    const isRightPrimitive = !hasProp(rhs, '_$metadata') || rhs === null || Array.isArray(rhs)

    if (isLeftPrimitive && isRightPrimitive) return

    if (isLeftPrimitive && !isRightPrimitive) {
        const opr = operators[oppositeOperators[operator.value]]
        if (!opr) return

        rhs._$metadata.assign(opr, lhs)
        return rhs
    }

    if (isRightPrimitive && !isLeftPrimitive) {
        const opr = operators[operator.value]
        if (!opr) return

        if (lhs._$metadata.type != "name") return

        lhs._$metadata.assign(opr, rhs)
        return lhs
    }

    if (!isLeftPrimitive && !isRightPrimitive) {
        const opr = operators[operator.value]
        if (!opr) return

        if (rhs._$metadata.path.length != 1) return

        lhs._$metadata.assign(opr, prisma[tableName].fields[rhs._$metadata.path[0]])
        return lhs
    }

    return
}

function transformInfix1Operation(prisma: any, tableName: string, ast: any): any {
    if (!ast) return
    const { left, right, operator } = ast
    const operators = {
        "and": "AND"
    } as any

    const lhs = transformExpr2(prisma, tableName, left)

    if (lhs === undefined || !hasProp(lhs, '_$metadata')) return

    const rhs = transformExpr2(prisma, tableName, right)

    if (rhs === undefined) return lhs
    if (!hasProp(rhs, '_$metadata')) return

    const opr = operators[operator.value]
    if (!opr) return

    const metadata = {
        type: "infix1-operation",
        assign(prop: string, value: any) { }
    }

    return { [opr]: [lhs, rhs], _$metadata: metadata }
}

function transformInfix2Operation(prisma: any, tableName: string, ast: any): any {
    if (!ast) return
    const { left, right, operator } = ast
    const operators = {
        "or": "OR"
    } as any

    const lhs = transformExpr2(prisma, tableName, left)
    if (lhs === undefined || !hasProp(lhs, '_$metadata')) return

    const rhs = transformExpr2(prisma, tableName, right)

    if (rhs === undefined) return lhs
    if (!hasProp(rhs, '_$metadata')) return

    const opr = operators[operator.value]

    if (!opr) return

    const metadata = {
        type: "infix2-operation",
        assign(prop: string, value: any) { }
    }

    return { [opr]: [lhs, rhs], _$metadata: metadata }
}

function transformPrefixOperation(prisma: any, tableName: string, ast: any): any {
    if (!ast) return

    const operators = {
        "not": "NOT"
    } as any

    const { operator, operand } = ast
    const term = transformTerm(prisma, tableName, operand)

    if (term === undefined || !hasProp(term, '_$metadata')) return

    const opr = operators[operator.value]
    if (!opr) return

    const metadata = {
        type: "prefix-operation",
        assign(prop: string, value: any) { }
    }

    return { [opr]: term, _$metadata: metadata }
}

function removeMetadata(obj: any) {
    deepVisit(obj, (obj) => delete obj._$metadata)
    return obj
}

function deepVisit(root: any, visit: (obj: any, prop: string | number, value: any) => void) {
    switch (true) {
        case Array.isArray(root): {
            for (let i = 0; i < root.length; i++) {
                deepVisit(root[i], visit)
            }
            break
        }
        case root && typeof root == "object": {
            for (const key in root) {
                visit(root, key, deepVisit(root[key], visit))
            }
            break
        }
    }
    return root
}

function hasProp(obj: any, prop: any) {
    return typeof obj == "object" && prop && prop in obj
}

type Prisma = {
    [model: string]: {
        fields: {
            [field: string]: {
                isList: boolean,
                modelName: string,
                name: string,
                typeName: string,
            }
        }
    }
}