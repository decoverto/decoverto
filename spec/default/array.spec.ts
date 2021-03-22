import test from 'ava';

import {Any, array, DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {Everything, IEverything} from '../utils/everything';

const decoratedJson = new DecoratedJson();

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

test('array of objects should parse an empty array', t => {
    const result = decoratedJson.type(Simple).parseJsonAsArray('[]');
    t.not(result, undefined);
    t.is(result.length, 0);
});

test('array of objects should stringify an empty array', t => {
    const result = decoratedJson.type(Simple).stringifyArray([]);
    t.is(result, '[]');
});

test('array of objects parse result should be the correct type', t => {
    const expectation = [
        {strProp: 'delta', numProp: 4},
        {strProp: 'bravo', numProp: 2},
        {strProp: 'gamma', numProp: 0},
    ];

    const result = decoratedJson.type(Simple).parseJsonAsArray(JSON.stringify(expectation));

    t.is(result.length, 3, 'Parsed array is of wrong length');
    result.forEach((obj, index) => {
        t.true(obj instanceof Simple);
        t.not(expectation[index], undefined);
    });
});

test('array of objects toJson result should contain all elements', t => {
    const expectation = [
        {strProp: 'delta', numProp: 4},
        {strProp: 'bravo', numProp: 2},
        {strProp: 'gamma', numProp: 0},
    ];

    const result = decoratedJson
        .type(Simple)
        .stringifyArray(expectation.map(obj => new Simple(obj)));

    t.is(result, JSON.stringify(expectation));
});

test('array of objects should error on non-array fromJson', t => {
    t.throws(() => decoratedJson.type(Simple).parsePlainAsArray(false as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Boolean',
            expectedType: 'Array<Simple>',
            path: '',
        }),
    });
});

test('array of objects should error on non-array toJson', t => {
    t.throws(() => decoratedJson.type(Simple).arrayToPlain(false as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Boolean',
            expectedType: 'Array<Simple>',
            path: '',
        }),
    });
});

(() => {
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

    test('multidimensional arrays parse correctly', t => {
        const result = decoratedJson.type(WithArrays).parsePlain(createTestObject(false));

        t.is(result.one.length, 2);
        t.is(result.two.length, 4);
        t.true(Array.isArray(result.deep[0][0][0][0][0]));
        t.deepEqual(result.one[0], Everything.expected());
        t.deepEqual(result.deep[0][0][0][1][0][0], Everything.expected());
    });

    test('converts to JSON', t => {
        const result = decoratedJson.type(WithArrays).stringify(createTestObject(true));

        t.is(result, JSON.stringify(createTestObject(true)));
    });
})();

@jsonObject()
class ArrayPropertyAny {
    @jsonProperty(array(Any))
    any: Array<any>;

    @jsonProperty(array(Any))
    anyNullable?: Array<any> | null;
}
const arrayPropertyAnyHandler = decoratedJson.type(ArrayPropertyAny);

test('@jsonProperty(array(Any)) should parse from JSON simple object correctly', t => {
    const result = arrayPropertyAnyHandler.parsePlain({
        any: [{foo: 'bar'}],
        anyNullable: [{foo: 'bar'}],
    });
    t.true(Array.isArray(result.any));
    t.is(result.any[0].foo, 'bar');
    t.true(Array.isArray(result.anyNullable));
    t.is(result.anyNullable?.[0].foo, 'bar');
});

test('@jsonProperty(array(Any)) should parse class instance correctly', t => {
    const foo = {foo: 'bar'};
    const result = arrayPropertyAnyHandler.parsePlain({
        any: [foo],
        anyNullable: [foo],
    });
    t.true(Array.isArray(result.any));
    t.deepEqual(result.any[0], foo);
    t.true(Array.isArray(result.anyNullable));
    t.deepEqual(result.anyNullable?.[0], foo);
});

test('@jsonProperty(array(Any)) should convert with referential equality', t => {
    const foo = {foo: 'bar'};
    const arrayPropertyAny = new ArrayPropertyAny();
    arrayPropertyAny.any = [foo];
    arrayPropertyAny.anyNullable = [foo];
    const result = arrayPropertyAnyHandler.toPlain(arrayPropertyAny);
    t.is(result.any[0], foo);
    t.is(result.anyNullable[0], foo);
});
