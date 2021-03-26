import {model, property} from '../../src';

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

@model()
export class Everything implements IEverything {
    @property()
    strProp: string;
    @property()
    numProp: number;
    @property()
    boolProp: boolean;
    @property()
    enum: JustEnum;
    @property()
    constEnum: ConstEnum;
    @property()
    strEnum: StrEnum;
    @property()
    constStrEnum: ConstStrEnum;
    // @property()
    // heteroEnum: HeteroEnum;
    // @property()
    // heteroEnum2: HeteroEnum;
    // @property()
    // constHeteroEnum: ConstHeteroEnum;
    // @property()
    // constHeteroEnum2: ConstHeteroEnum;
    // @property()
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
        return new Everything(obj);
    }

    foo() {
        return 'Just to be sure';
    }
}
