declare const term: (str: string, idx?: number) => {
    readonly type: "term";
    readonly value: any;
    readonly idx: number;
} | null;
declare const prefix: (str: string, idx?: number) => {
    readonly type: "prefix";
    readonly idx: number;
    readonly value: string;
} | null;
declare const infix0: (str: string, idx?: number) => {
    readonly type: "infix0";
    readonly idx: number;
    readonly value: string;
} | null;
declare const infix1: (str: string, idx?: number) => {
    readonly type: "infix1";
    readonly idx: number;
    readonly value: string;
} | null;
declare const infix2: (str: string, idx?: number) => {
    readonly type: "infix2";
    readonly idx: number;
    readonly value: string;
} | null;
declare const expr0: (str: string, idx?: number) => {
    readonly type: "term";
    readonly value: any;
    readonly idx: number;
} | PrefixOperation | Infix0Operation | null;
declare const expr1: (str: string, idx?: number) => Infix1Operation | NonNullable<{
    readonly type: "term";
    readonly value: any;
    readonly idx: number;
} | PrefixOperation | Infix0Operation | null> | null;
export declare const parse: {
    space: (str: string, idx?: number) => {
        readonly type: "space";
        readonly value: string;
        readonly idx: number;
    } | null;
    null: (str: string, idx?: number) => {
        readonly type: "null";
        readonly value: null;
        readonly idx: number;
    } | null;
    boolean: (str: string, idx?: number) => {
        readonly type: "boolean";
        readonly value: boolean;
        readonly idx: number;
    } | null;
    number: (str: string, idx?: number) => {
        readonly type: "number";
        readonly value: number;
        readonly idx: number;
    } | null;
    string: (str: string, idx?: number) => {
        type: string;
        value: string;
        idx: number;
    } | null;
    word: (str: string, idx?: number) => {
        readonly type: "word";
        readonly value: string;
        readonly idx: number;
    } | null;
    name: (str: string, idx?: number) => {
        readonly type: "name";
        readonly idx: number;
        readonly words: {
            value: string;
            isArray: boolean;
        }[];
    } | null;
    term: (str: string, idx?: number) => {
        readonly type: "term";
        readonly value: any;
        readonly idx: number;
    } | null;
    list: (str: string, idx?: number) => {
        readonly type: "list";
        readonly value: {
            readonly type: "term";
            readonly value: any;
            readonly idx: number;
        }[];
        readonly idx: number;
    } | null;
    group: (str: string, idx?: number) => {
        readonly type: "group";
        readonly value: Infix2Operation | NonNullable<Infix1Operation | NonNullable<{
            readonly type: "term";
            readonly value: any;
            readonly idx: number;
        } | PrefixOperation | Infix0Operation | null> | null>;
        readonly idx: number;
    } | null;
    prefix: (str: string, idx?: number) => {
        readonly type: "prefix";
        readonly idx: number;
        readonly value: string;
    } | null;
    infix0: (str: string, idx?: number) => {
        readonly type: "infix0";
        readonly idx: number;
        readonly value: string;
    } | null;
    infix1: (str: string, idx?: number) => {
        readonly type: "infix1";
        readonly idx: number;
        readonly value: string;
    } | null;
    infix2: (str: string, idx?: number) => {
        readonly type: "infix2";
        readonly idx: number;
        readonly value: string;
    } | null;
    expr0: (str: string, idx?: number) => {
        readonly type: "term";
        readonly value: any;
        readonly idx: number;
    } | PrefixOperation | Infix0Operation | null;
    expr1: (str: string, idx?: number) => Infix1Operation | NonNullable<{
        readonly type: "term";
        readonly value: any;
        readonly idx: number;
    } | PrefixOperation | Infix0Operation | null> | null;
    expr2: (str: string, idx?: number) => Infix2Operation | NonNullable<Infix1Operation | NonNullable<{
        readonly type: "term";
        readonly value: any;
        readonly idx: number;
    } | PrefixOperation | Infix0Operation | null> | null> | null;
};
export type PrefixOperation = {
    type: "prefix-operation";
    operator: NonNullable<ReturnType<typeof prefix>>;
    operand: NonNullable<ReturnType<typeof term>>;
    idx: number;
};
export type Infix0Operation = {
    type: "infix0-operation";
    operator: NonNullable<ReturnType<typeof infix0>>;
    left: Infix0Operation | PrefixOperation | NonNullable<ReturnType<typeof term>>;
    right: PrefixOperation | NonNullable<ReturnType<typeof term>>;
    idx: number;
};
export type Infix1Operation = {
    type: "infix1-operation";
    operator: NonNullable<ReturnType<typeof infix1>>;
    left: Infix1Operation | NonNullable<ReturnType<typeof expr0>>;
    right: NonNullable<ReturnType<typeof expr0>>;
    idx: number;
};
export type Infix2Operation = {
    type: "infix2-operation";
    operator: NonNullable<ReturnType<typeof infix2>>;
    left: Infix2Operation | NonNullable<ReturnType<typeof expr1>>;
    right: NonNullable<ReturnType<typeof expr1>>;
    idx: number;
};
export {};
