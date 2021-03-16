import {jsonObject, jsonProperty} from '../../src';

export enum JustEnum {
    One = 1,
    Two = 2,
    Four = 4,
}

export const enum ConstEnum {
    One = 1,
    Two = 2,
    Four = 4,
}

export enum StrEnum {
    One = 'ONE',
    Two = 'TWO',
    Four = 'FOUR',
}

export const enum ConstStrEnum {
    One = 'ONE',
    Two = 'TWO',
    Four = 'FOUR',
}

export enum HeteroEnum {
    One = 1,
    Two = 2,
    Four = 'FOUR',
}

export const enum ConstHeteroEnum {
    One = 1,
    Two = 2,
    Four = 'FOUR',
}

export const symbolProp: unique symbol = Symbol('symbolProp');

export interface IEverything {
    strProp: string;
    numProp: number;
    boolProp: boolean;
    dateProp: Date;
    // nullable is not supported, use optional instead
    // nullable: {}|null;
    optional?: Record<string, unknown>;
    undefinable: Record<string, unknown> | undefined;
    enum: JustEnum;
    constEnum: ConstEnum;
    strEnum: StrEnum;
    constStrEnum: ConstStrEnum;

    // Heterogenous enums are not supported right now
    // heteroEnum: HeteroEnum;
    // heteroEnum2: HeteroEnum;
    // constHeteroEnum: ConstHeteroEnum;
    // constHeteroEnum2: ConstHeteroEnum;

    // Symbol props are not supported
    // [symbolProp]: string;
}

@jsonObject()
export class Everything implements IEverything {
    @jsonProperty()
    strProp: string;
    @jsonProperty()
    numProp: number;
    @jsonProperty()
    boolProp: boolean;
    @jsonProperty()
    dateProp: Date;
    // @jsonProperty()
    // nullable: {}|null;
    @jsonProperty()
    // eslint-disable-next-line @typescript-eslint/ban-types
    optional?: {};
    @jsonProperty()
    // eslint-disable-next-line @typescript-eslint/ban-types
    undefinable: {} | undefined;
    @jsonProperty()
    enum: JustEnum;
    @jsonProperty()
    constEnum: ConstEnum;
    @jsonProperty()
    strEnum: StrEnum;
    @jsonProperty()
    constStrEnum: ConstStrEnum;
    // @jsonProperty()
    // heteroEnum: HeteroEnum;
    // @jsonProperty()
    // heteroEnum2: HeteroEnum;
    // @jsonProperty()
    // constHeteroEnum: ConstHeteroEnum;
    // @jsonProperty()
    // constHeteroEnum2: ConstHeteroEnum;
    // @jsonProperty()
    // [symbolProp]: string;

    constructor(init?: IEverything) {
        if (init !== undefined) {
            Object.assign(this, init);
        }
    }

    static create(): IEverything {
        return {
            strProp: 'string',
            numProp: 123,
            boolProp: true,
            dateProp: new Date(1543912019),
            // nullable: null,
            undefinable: undefined,
            enum: JustEnum.Four,
            constEnum: ConstEnum.Four,
            strEnum: StrEnum.Four,
            constStrEnum: ConstStrEnum.Four,
            // heteroEnum: HeteroEnum.Two,
            // heteroEnum2: HeteroEnum.Four,
            // constHeteroEnum: ConstHeteroEnum.Two,
            // constHeteroEnum2: ConstHeteroEnum.Four,
            // [symbolProp]: 'symbol string',
        };
    }

    static expected(): Everything {
        const obj = Everything.create();
        // properties that are undefined are not present in the resulting JSON
        delete obj.undefinable;
        return new Everything(obj);
    }

    foo() {
        return 'Just to be sure';
    }
}
