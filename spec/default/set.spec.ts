import test from 'ava';

import {Any, array, Decoverto, model, property, set} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';
import {Everything} from '../utils/everything';

const decoverto = new Decoverto();

@model()
class Simple {
    @property()
    strProp: string;

    @property()
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
    const result = decoverto.type(Simple).rawToInstanceSet('[]');
    t.not(result, undefined);
    t.is(result.size, 0);
});

test('Set of objects stringifies an empty set', t => {
    const result = decoverto.type(Simple).setInstanceToRaw(new Set<Simple>());
    t.is(result, '[]');
});

test('Set of objects parsed should be of proper type', t => {
    const expectation = [
        {strProp: 'delta', numProp: 4},
        {strProp: 'bravo', numProp: 2},
        {strProp: 'gamma', numProp: 0},
    ];

    const result = decoverto.type(Simple).rawToInstanceSet(JSON.stringify(expectation));

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
    const result = decoverto.type(Simple).setInstanceToRaw(input);

    t.is(result, JSON.stringify(expectation));
});

test('An error should occur on toInstance with a non-array', t => {
    t.throws(() => decoverto.type(Simple).plainToInstanceSet(false as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Boolean',
            expectedType: 'Array<Simple>',
            path: '',
        }),
    });
});

test('An error should occur on toPlain with a non-Set', t => {
    t.throws(() => decoverto.type(Simple).instanceSetToPlain([] as any), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Array',
            expectedType: 'Set<Simple>',
            path: '',
        }),
    });
});

@model()
class WithSet {
    @property(set(() => Everything))
    prop: Set<Everything>;

    getSetSize() {
        return this.prop.size;
    }
}

const passThroughMacro = createPassThroughMacro({
    class: WithSet,
    createSubject: value => ({prop: value}),
});

test('@property(set(...))', passThroughMacro, {
    type: 'toInstance',
    value: null,
});

test('@property(set(...))', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('@property(set(...))', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('@property(set(...))', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

test('@property(set(...)) should convert from JSON', t => {
    const object = {prop: [Everything.create(), Everything.create()]};
    const result = decoverto.type(WithSet).rawToInstance(JSON.stringify(object));

    t.true(result instanceof WithSet);
    t.not(result.prop, undefined);
    t.true(result.prop instanceof Set);
    t.is(result.prop.size, 2);
    t.is(result.getSetSize(), 2);
    t.deepEqual(Array.from(result.prop), [Everything.expected(), Everything.expected()]);
});

test('@property(set(...)) should convert to JSON', t => {
    const object = new WithSet();
    object.prop = new Set<Everything>([Everything.expected(), Everything.expected()]);
    const result = decoverto.type(WithSet).instanceToRaw(object);

    t.is(result, JSON.stringify({prop: [Everything.create(), Everything.create()]}));
});

@model()
class WithSetArray {
    @property(set(array(() => Simple)))
    prop: Set<Array<Simple>>;

    getSetSize() {
        return this.prop.size;
    }
}

test('@property(set(array(...))) should convert from JSON', t => {
    const result = decoverto.type(WithSetArray).rawToInstance(
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

test('@property(set(array(...))) should convert to JSON', t => {
    const object = new WithSetArray();
    object.prop = new Set<Array<Simple>>([
        [new Simple({strProp: 'delta', numProp: 4})],
        [
            new Simple({strProp: 'alpha', numProp: 3245}),
            new Simple({strProp: 'zeta', numProp: 4358}),
        ],
    ]);
    const result = decoverto.type(WithSetArray).instanceToRaw(object);

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

@model()
class SetPropertyAny {

    @property(set(Any))
    any: Set<any>;

    @property(set(Any))
    anyNullable?: Set<any> | null;
}

test('@property(set(Any)) should parse simple object correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoverto.type(SetPropertyAny).plainToInstance({
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

test('@property(array(Any)) should parse class instance correctly', t => {
    const foo = {foo: 'bar'};
    const result = decoverto.type(SetPropertyAny).plainToInstance({
        any: [foo, foo],
        anyNullable: [foo, foo],
    });
    t.true(result.any instanceof Set);
    t.is(result.any.values().next().value, foo);
    t.true(result.anyNullable instanceof Set);
    t.is(result.anyNullable?.values().next().value, foo);
});

test('@property(set(Any)) should convert with referential equality', t => {
    const foo = {foo: 'bar'};
    const setPropertyAny = new SetPropertyAny();
    setPropertyAny.any = new Set([foo, foo]);
    setPropertyAny.anyNullable = new Set([foo, foo]);
    const result = decoverto.type(SetPropertyAny).instanceToPlain(setPropertyAny);
    t.is(result.any.values().next().value, foo);
    t.is(result.anyNullable.values().next().value, foo);
});
