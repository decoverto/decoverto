import {AnyT, DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';
import {Everything, IEverything} from './utils/everything';

const decoratedJson = new DecoratedJson();

describe('array of objects', () => {
    @jsonObject()
    class Simple {
        @jsonMember()
        strProp: string;

        @jsonMember()
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

    it('deserializes empty array', () => {
        const result = decoratedJson.type(Simple).parseAsArray('[]');
        expect(result).toBeDefined();
        expect(result.length).toBe(0);
    });

    it('serialized empty array', () => {
        const result = decoratedJson.type(Simple).stringifyAsArray([]);
        expect(result).toBe('[]');
    });

    it('deserialized should be of proper type', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const result = decoratedJson.type(Simple).parseAsArray(JSON.stringify(expectation));

        expect(result.length).toBe(3, 'Deserialized array is of wrong length');
        result.forEach((obj, index) => {
            expect(obj instanceof Simple).toBeTruthy(`${index} was not of type Simple`);
            expect(obj)
                .toHaveProperties(expectation[index], '${index} was deserialized incorrectly');
        });
    });

    it('serialized should contain all elements', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const result = decoratedJson
            .type(Simple)
            .stringifyAsArray(expectation.map(obj => new Simple(obj)));

        expect(result).toBe(JSON.stringify(expectation));
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
        @jsonArrayMember(() => Everything)
        one: Array<Everything>;

        @jsonArrayMember(() => Everything, {dimensions: 2})
        two: Array<Array<Everything>>;

        @jsonArrayMember(() => Everything, {dimensions: 6})
        deep: Array<Array<Array<Array<Array<Array<Everything>>>>>>;

        @jsonArrayMember(() => WithArrays, {dimensions: 2})
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
                [],
                [[expected ? Everything.expected() : Everything.create()]],
            ]]]],
            arrayWithArray: [
                [],
                [expected ? new WithArrays(nested) : nested],
            ],
        };

        return expected ? new WithArrays(result) : result;
    }

    function createTestArray(expected: true): Array<Array<WithArrays>>;
    function createTestArray(expected: false): Array<Array<IWithArrays>>;
    function createTestArray(
        expected: boolean,
    ): Array<Array<IWithArrays>> | Array<Array<WithArrays>> {
        return [
            [],
            [
                createTestObject(expected),
                createTestObject(expected),
            ],
            [],
            [
                createTestObject(expected),
            ],
        ];
    }

    it('deserializes', () => {
        const testArray = JSON.stringify(createTestArray(false));
        const result = decoratedJson.type(WithArrays).parseAsArray(testArray, 2);

        expect(result).toBeOfLength(4);
        expect(result[0]).toBeOfLength(0);
        expect(result[1]).toBeOfLength(2);
        expect(result[1][0]).toEqual(createTestObject(true));
        expect(result[1][1]).toEqual(createTestObject(true));
        expect(result[2]).toBeOfLength(0);
        expect(result[3]).toBeOfLength(1);
        expect(result[3][0]).toEqual(createTestObject(true));
    });

    it('serializes', () => {
        const result = decoratedJson.type(WithArrays).stringifyAsArray(createTestArray(true), 2);

        expect(result).toBe(JSON.stringify(createTestArray(false)));
    });
});

describe('array of raw objects', () => {
    @jsonObject()
    class Translations {
        @jsonArrayMember(() => AnyT)
        localization: Array<any>;
    }

    function localization() {
        return [
            {
                language_tag: 'en_us',
                '/actions/main': 'My Game Actions',
                '/actions/driving': 'Driving',
            },
            {
                language_tag: 'fr',
                '/actions/main': 'Mes actions de jeux',
                '/actions/driving': 'Conduire',
            },
        ];
    }

    it('should deserialize as is', () => {
        const translations = decoratedJson.type(Translations).parse({localization: localization()});
        expect(translations).toBeDefined();
        expect(translations instanceof Translations).toBeTruthy();
        expect(translations.localization).toEqual(localization());
    });

    it('should serialize as is', () => {
        const translations = new Translations();
        translations.localization = localization();
        const json = decoratedJson.type(Translations).toPlainJson(translations);
        expect(json).toEqual({localization: localization()});
    });
});
