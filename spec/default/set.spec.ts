import test from 'ava';

import {Any, array, DecoratedJson, jsonObject, jsonProperty, set} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';
import {Everything} from '../utils/everything';

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

test('Set of objects parses an empty set', t => {
    const result = decoratedJson.type(Simple).parseJsonAsSet('[]');
    t.not(result, undefined);
    t.is(result.size, 0);
});

test('Set of objects stringifies an empty set', t => {
    const result = decoratedJson.type(Simple).stringifySet(new Set<Simple>());
    t.is(result, '[]');
});

test('Set of objects parsed should be of proper type', t => {
    const expectation = [
        {strProp: 'delta', numProp: 4},
        {strProp: 'bravo', numProp: 2},
        {strProp: 'gamma', numProp: 0},
    ];

    const result = decoratedJson.type(Simple).parseJsonAsSet(JSON.stringify(expectation));

    t.is(result.size, 3, 'Parsed set is of wrong size');
    result.forEach(obj => {
        t.true(obj instanceof Simple);
        t.not(expectation.find(expected => expected.strProp === obj.strProp), undefined);
    });
});

test('Set of objects stringified should contain all elements', t => {
    const expectation = [
        {strProp: 'delta', numProp: 4},
        {strProp: 'bravo', numProp: 2},
        {strProp: 'gamma', numProp: 0},
    ];

    const input = new Set<Simple>(expectation.map(obj => new Simple(obj)));
    const result = decoratedJson.type(Simple).stringifySet(input);

    t.is(result, JSON.stringify(expectation));
});

test('An error should occur on fromJson with a non-array', t => {
    t.throws(() => decoratedJson.type(Simple).parsePlainAsSet(false as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Boolean',
            expectedType: 'Array<Simple>',
            path: '',
        }),
    });
});

test('An error should occur on toJson with a non-Set', t => {
    t.throws(() => decoratedJson.type(Simple).setToPlain([] as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Array',
            expectedType: 'Set<Simple>',
            path: '',
        }),
    });
});

@jsonObject()
class WithSet {
    @jsonProperty(set(() => Everything))
    prop: Set<Everything>;

    getSetSize() {
        return this.prop.size;
    }
}

const passThroughMacro = createPassThroughMacro({
    class: WithSet,
    createSubject: value => ({prop: value}),
});

test('@jsonProperty(set(...))', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('@jsonProperty(set(...))', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('@jsonProperty(set(...))', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('@jsonProperty(set(...))', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

test('@jsonProperty(set(...)) should convert from JSON', t => {
    const object = {prop: [Everything.create(), Everything.create()]};
    const result = decoratedJson.type(WithSet).parseJson(JSON.stringify(object));

    t.true(result instanceof WithSet);
    t.not(result.prop, undefined);
    t.true(result.prop instanceof Set);
    t.is(result.prop.size, 2);
    t.is(result.getSetSize(), 2);
    t.deepEqual(Array.from(result.prop), [Everything.expected(), Everything.expected()]);
});

test('@jsonProperty(set(...)) should convert to JSON', t => {
    const object = new WithSet();
    object.prop = new Set<Everything>([Everything.expected(), Everything.expected()]);
    const result = decoratedJson.type(WithSet).stringify(object);

    t.is(result, JSON.stringify({prop: [Everything.create(), Everything.create()]}));
});

@jsonObject()
class WithSetArray {
    @jsonProperty(set(array(() => Simple)))
    prop: Set<Array<Simple>>;

    getSetSize() {
        return this.prop.size;
    }
}

test('@jsonProperty(set(array(...))) should convert from JSON', t => {
    const result = decoratedJson.type(WithSetArray).parseJson(
        JSON.stringify(
            {
                prop: [
                    [
                        {strProp: 'delta', numProp: 4},
                        {strProp: 'bravo', numProp: 2},
                        {strProp: 'gamma', numProp: 0},
                    ],
                    [
                        {strProp: 'alpha', numProp: 3245},
                        {strProp: 'zeta', numProp: 4358},
                    ],
                ],
            },
        ),
    );

    t.true(result instanceof WithSetArray);
    t.not(result.prop, undefined);
    t.true(result.prop instanceof Set);
    t.is(result.prop.size, 2);
    t.is(result.getSetSize(), 2);
    t.deepEqual(Array.from(result.prop), [
        [
            new Simple({strProp: 'delta', numProp: 4}),
            new Simple({strProp: 'bravo', numProp: 2}),
            new Simple({strProp: 'gamma', numProp: 0}),
        ],
        [
            new Simple({strProp: 'alpha', numProp: 3245}),
            new Simple({strProp: 'zeta', numProp: 4358}),
        ],
    ]);
});

test('@jsonProperty(set(array(...))) should convert to JSON', t => {
    const object = new WithSetArray();
    object.prop = new Set<Array<Simple>>([
        [new Simple({strProp: 'delta', numProp: 4})],
        [
            new Simple({strProp: 'alpha', numProp: 3245}),
            new Simple({strProp: 'zeta', numProp: 4358}),
        ],
    ]);
    const result = decoratedJson.type(WithSetArray).stringify(object);

    t.is(result, JSON.stringify({
        prop: [
            [
                {
                    strProp: 'delta',
                    numProp: 4,
                },
            ],
            [
                {
                    strProp: 'alpha',
                    numProp: 3245,
                },
                {
                    strProp: 'zeta',
                    numProp: 4358,
                },
            ],
        ],
    }));
});

@jsonObject()
class SetPropertyAny {

    @jsonProperty(set(Any))
    any: Set<any>;

    @jsonProperty(set(Any))
    anyNullable?: Set<any> | null;
}

test('@jsonProperty(set(Any)) should parse simple object correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoratedJson.type(SetPropertyAny).parsePlain({
        any: [foo, foo],
        anyNullable: [foo, foo],
    });
    t.true(result.any instanceof Set);
    t.is(result.any.size, 1);
    t.is(result.any.values().next().value, foo);
    t.true(result.anyNullable instanceof Set);
    t.is(result.anyNullable?.size, 1);
    t.is(result.anyNullable?.values().next().value, foo);
});

test('@jsonProperty(array(Any)) should parse class instance correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoratedJson.type(SetPropertyAny).parsePlain({
        any: [foo, foo],
        anyNullable: [foo, foo],
    });
    t.true(result.any instanceof Set);
    t.is(result.any.values().next().value, foo);
    t.true(result.anyNullable instanceof Set);
    t.is(result.anyNullable?.values().next().value, foo);
});

test('@jsonProperty(set(Any)) should convert with referential equality', t => {
    const foo = {foo: 'bar'};
    const setPropertyAny = new SetPropertyAny();
    setPropertyAny.any = new Set([foo, foo]);
    setPropertyAny.anyNullable = new Set([foo, foo]);
    const result = decoratedJson.type(SetPropertyAny).toPlain(setPropertyAny);
    t.is(result.any.values().next().value, foo);
    t.is(result.anyNullable.values().next().value, foo);
});
