import { createFilter } from "./prisma"
import { parse } from "./index"

const db = {
    tblA: {
        fields: {
            a: Symbol("a"),
            b: Symbol("b"),
            c: Symbol("c"),
            d: Symbol("d"),
        }
    },
    tblB: {
        fields: {
            e: Symbol("e"),
            f: Symbol("f"),
            g: Symbol("g"),
            h: Symbol("h"),
        }
    },
    tblC: {
        fields: {
            i: Symbol("i"),
            j: Symbol("j"),
            k: Symbol("k"),
            l: Symbol("l"),
        }
    },
    tblD: {
        fields: {
            m: Symbol("m"),
            n: Symbol("n"),
            o: Symbol("o"),
            p: Symbol("p"),
        }
    },
}

describe("Parsing functions", () => {
    it("Should produce a space object", () => {
        expect(parse.space(` \n \t  `))
            .toEqual({ type: "space", value: ` \n \t  `, idx: 6 })
        expect(parse.space(""))
            .toEqual(null)
        expect(parse.space("jkja&"))
            .toEqual(null)
    })
    it("Should produce a null object", () => {
        expect(parse.null("null"))
            .toEqual({ type: "null", value: null, idx: 4 })
        expect(parse.null(""))
            .toEqual(null)
        expect(parse.null("jkja&"))
            .toEqual(null)
    })
    it("Should produce a boolean object", () => {
        expect(parse.boolean("true"))
            .toEqual({ type: "boolean", value: true, idx: 4 })
        expect(parse.boolean(""))
            .toEqual(null)
        expect(parse.boolean("jkja&"))
            .toEqual(null)
    })
    it("Should produce a number object", () => {
        expect(parse.number("1"))
            .toEqual({ type: "number", value: 1, idx: 1 })
        expect(parse.number("1.5"))
            .toEqual({ type: "number", value: 1.5, idx: 3 })
        expect(parse.number("-14.357"))
            .toEqual({ type: "number", value: -14.357, idx: 7 })
        expect(parse.number(""))
            .toEqual(null)
        expect(parse.number("jkja&"))
            .toEqual(null)
    })
    it("Should produce a string object", () => {
        expect(parse.string(`""`))
            .toEqual({ type: "string", value: '', idx: 2 })
        expect(parse.string(String.raw`"abc 😁 2m&426 \\"`))
            .toEqual({ type: "string", value: "abc 😁 2m&426 \\\\", idx: 18 })
        expect(parse.string(String.raw`"abc\" 😁 2\\\\m&426 \\"`))
            .toEqual({ type: "string", value: "abc\\\" 😁 2\\\\\\\\m&426 \\\\", idx: 24 })
        expect(parse.string(""))
            .toEqual(null)
        expect(parse.string("jkja&"))
            .toEqual(null)
    })
    it("Should produce a word object", () => {
        expect(parse.word("_ab0c_18sj"))
            .toEqual({ type: "word", value: "_ab0c_18sj", idx: 10 })
        expect(parse.word(" \n][0"))
            .toEqual(null)
        expect(parse.word("901jkja"))
            .toEqual(null)
    })
    it("Should produce a name object", () => {
        expect(parse.name("abc"))
            .toEqual({ type: "name", words: [{ value: "abc", isArray: false }], idx: 3 })
        expect(parse.name("abc.def[].gji"))
            .toEqual({ type: "name", words: [{ value: "abc", isArray: false }, { value: "def", isArray: true }, { value: "gji", isArray: false }], idx: 13 })
        expect(parse.word(" \n][0"))
            .toEqual(null)
        expect(parse.word("901jkja"))
            .toEqual(null)
    })
    it("Should produce a group object", () => {
        expect(parse.group("(abc)"))
            .toEqual({ type: "group", value: { type: "term", value: { type: "name", words: [{ value: "abc", isArray: false }], idx: 4 }, idx: 4 }, idx: 5 })
    })
})