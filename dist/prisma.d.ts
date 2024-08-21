export declare function createFilter<T extends Prisma>(prisma: T, tableName: keyof T, filterStr: string): any;
type Prisma = {
    [model: string]: {
        fields: {
            [field: string]: {
                isList: boolean;
                modelName: string;
                name: string;
                typeName: string;
            };
        };
    };
};
export {};
