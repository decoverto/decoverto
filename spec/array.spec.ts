import {Any, array, DecoratedJson, jsonObject, jsonProperty} from '../src';
import {Everything, IEverything} from './utils/everything';

const decoratedJson = new DecoratedJson();

describe('array of objects', () => {
    @jsonObject()
    class Simple {
        @jsonProperty()
        strProp: string;

        @jsonProperty()
        numProp: number;

        constructor(init?: {strProp: string; numProp: number}) {
            if (init !== undefined) {
                this.strProp = init.strProp;
                this.numProp = init.numProp;
            }
        }

        foo() {
            return `${this.strProp}-${this.numProp}`;
        }
    }

    it('should parse an empty array', () => {
        const result = decoratedJson.type(Simple).parseArray('[]');
        expect(result).toBeDefined();
        expect(result.length).toBe(0);
    });

    it('should stringify an empty array', () => {
        const result = decoratedJson.type(Simple).stringifyArray([]);
        expect(result).toBe('[]');
    });

    it('parse result should be the correct type', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const result = decoratedJson.type(Simple).parseArray(JSON.stringify(expectation));

        expect(result.length).toBe(3, 'Parsed array is of wrong length');
        result.forEach((obj, index) => {
            expect(obj instanceof Simple).toBeTruthy(`${index} was not of type Simple`);
            expect(obj)
                .toHaveProperties(expectation[index], '${index} was parsed incorrectly');
        });
    });

    it('toJson result should contain all elements', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const result = decoratedJson
            .type(Simple)
            .stringifyArray(expectation.map(obj => new Simple(obj)));

        expect(result).toBe(JSON.stringify(expectation));
    });

    describe('should error', () => {
        it('on non-array fromJson', () => {
            expect(() => decoratedJson.type(Simple).parseArray(false as any))
                .toThrowError('Got invalid value. Received Boolean, expected Array<Simple>.');
        });

        it('on non-array toJson', () => {
            expect(() => decoratedJson.type(Simple).toPlainArray(false as any))
                .toThrowError('Got invalid value. Received Boolean, expected Array<Simple>.');
        });
    });
});

describe('multidimensional arrays', () => {
    interface IWithArrays {
        one: Array<IEverything>;
        two: Array<Array<IEverything>>;
        deep: Array<Array<Array<Array<Array<Array<IEverything>>>>>>;
        arrayWithArray?: Array<Array<IWithArrays>>;
    }

    @jsonObject()
    class WithArrays implements IWithArrays {
        @jsonProperty(array(() => Everything))
        one: Array<Everything>;

        @jsonProperty(array(array(() => Everything)))
        two: Array<Array<Everything>>;

        @jsonProperty(array(array(array(array(array(array(() => Everything)))))))
        deep: Array<Array<Array<Array<Array<Array<Everything>>>>>>;

        @jsonProperty(array(array(() => WithArrays)))
        arrayWithArray?: Array<Array<WithArrays>>;

        constructor(init?: IWithArrays) {
            if (init !== undefined) {
                Object.assign(this, init);
            }
        }
    }

    function createTestObject(expected: true): WithArrays;
    function createTestObject(expected: false): IWithArrays;
    function createTestObject(expected: boolean): IWithArrays;
    function createTestObject(expected: boolean): IWithArrays {
        const nested = {
            one: [
                expected ? Everything.expected() : Everything.create(),
                expected ? Everything.expected() : Everything.create(),
            ],
            two: [
                [],
                [],
            ],
            deep: [[[[]]]],
        };

        const result = {
            one: [
                expected ? Everything.expected() : Everything.create(),
                expected ? Everything.expected() : Everything.create(),
            ],
            two: [
                [expected ? Everything.expected() : Everything.create()],
                [expected ? Everything.expected() : Everything.create()],
                [],
                [],
            ],
            deep: [[[[
                [[]],
                [[expected ? Everything.expected() : Everything.create()]],
            ]]]],
            arrayWithArray: [
                [],
                [expected ? new WithArrays(nested) : nested],
            ],
        };

        return expected ? new WithArrays(result) : result;
    }

    it('parses', () => {
        const result = decoratedJson.type(WithArrays).parse(createTestObject(false));

        expect(result.one).toBeOfLength(2);
        expect(result.two).toBeOfLength(4);
        expect(result.deep[0][0][0][0][0]).toBeInstanceOf(Array);
        expect(result.one[0]).toEqual(Everything.expected());
        expect(result.deep[0][0][0][1][0][0]).toEqual(Everything.expected());
    });

    it('converts to JSON', () => {
        const result = decoratedJson.type(WithArrays).stringify(createTestObject(true));

        expect(result).toBe(JSON.stringify(createTestObject(true)));
    });
});

describe('array of any', () => {
    @jsonObject()
    class ArrayPropertyAny {
        @jsonProperty(array(Any))
        any: Array<any>;

        @jsonProperty(array(Any))
        anyNullable?: Array<any> | null;
    }

    const arrayPropertyAnyHandler = decoratedJson.type(ArrayPropertyAny);

    it('should parse from JSON simple object correctly', () => {
        const result = arrayPropertyAnyHandler.parse({
            any: [{foo: 'bar'}],
            anyNullable: [{foo: 'bar'}],
        });
        expect(result.any).toBeInstanceOf(Array);
        expect(result.any[0].foo).toEqual('bar');
        expect(result.anyNullable).toBeInstanceOf(Array);
        expect(result.anyNullable?.[0].foo).toEqual('bar');
    });

    it('should parse from JSON class instance correctly', () => {
        const foo = {foo: 'bar'};
        const result = arrayPropertyAnyHandler.parse({
            any: [foo],
            anyNullable: [foo],
        });
        expect(result.any).toBeInstanceOf(Array);
        expect(result.any[0]).toEqual(foo);
        expect(result.anyNullable).toBeInstanceOf(Array);
        expect(result.anyNullable?.[0]).toEqual(foo);
    });

    it('should perform conversion to JSON with referential equality', () => {
        const foo = {foo: 'bar'};
        const arrayPropertyAny = new ArrayPropertyAny();
        arrayPropertyAny.any = [foo];
        arrayPropertyAny.anyNullable = [foo];
        const result = arrayPropertyAnyHandler.toPlainJson(arrayPropertyAny);
        expect(result.any[0]).toEqual(foo);
        expect(result.anyNullable[0]).toEqual(foo);
    });
});
