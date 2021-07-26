import test from 'ava';

import {
    Any,
    array,
    Decoverto,
    map,
    MapShape,
    model,
    property,
} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

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

@model()
class DictMap {
    @property(map(() => String, () => Simple, {shape: MapShape.Object}))
    prop: Map<string, Simple>;

    getSetSize() {
        return this.prop.size;
    }
}

const passThroughMacro = createPassThroughMacro({
    class: DictMap,
    createSubject: value => ({prop: value}),
});

test('@property(map(...))', passThroughMacro, {
    type: 'toInstance',
    value: null,
});

test('@property(map(...))', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('@property(map(...))', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('@property(map(...))', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

test('Map with dictionary shape converts json to instance', t => {
    const result = decoverto.type(DictMap).rawToInstance(
        JSON.stringify(
            {
                prop: {
                    one: {strProp: 'delta', numProp: 4},
                    two: {strProp: 'gamma', numProp: 7},
                },
            },
        ),
    );

    t.true(result instanceof DictMap);
    t.not(result.prop, undefined);
    t.true(result.prop instanceof Map);
    t.is(result.prop.size, 2);
    t.is(result.getSetSize(), 2);
    t.is(result.prop.get('one')?.strProp, 'delta');
    t.is(result.prop.get('two')?.strProp, 'gamma');
});

test('Map with dictionary shape converts instance to JSON', t => {
    const object = new DictMap();
    object.prop = new Map<string, Simple>([
        ['one', new Simple({strProp: 'delta', numProp: 4})],
        ['two', new Simple({strProp: 'gamma', numProp: 7})],
    ]);
    const result = decoverto.type(DictMap).instanceToRaw(object);

    t.is(result, JSON.stringify({
        prop: {
            one: {strProp: 'delta', numProp: 4},
            two: {strProp: 'gamma', numProp: 7},
        },
    }));
});

test('Map plainToInstance with dictionary shape errors when an array type is provided', t => {
    t.throws(() => {
        decoverto.type(DictMap).plainToInstance({
            prop: [{key: 'key', value: 'value'}],
        });
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Array',
            path: `${DictMap.name}.prop`,
            expectedType: 'Object notation',
        }),
    });
});

@model()
class DictionaryArrayShape {
    @property(map(() => String, () => Simple, {shape: MapShape.Array}))
    map: Map<string, Simple>;
}

@model()
class DictionaryTupleShape {
    @property(map(() => String, () => Simple, {shape: MapShape.Tuple}))
    map: Map<string, Simple>;
}

test('Map with array shape converts to instance', t => {
    const result = decoverto.type(DictionaryArrayShape).plainToInstance({
        map: [
            {key: 'one', value: {numProp: 4, strPop: 'value1'}},
        ],
    });

    t.true(result.map instanceof Map);
    t.is(result.map.get('one')?.numProp, 4);
});

test('Map with array shape converts to JSON', t => {
    const object = new DictionaryArrayShape();
    object.map = new Map<string, Simple>([
        ['one', new Simple({numProp: 4, strProp: 'delta'})],
    ]);
    const result = decoverto.type(DictionaryArrayShape).instanceToPlain(object);
    t.true(result.map instanceof Array);
    t.is(result.map[0].key, 'one');
    t.is(result.map[0].value.numProp, 4);
});

test('Map with tuple shape converts to instance', t => {
    const result = decoverto.type(DictionaryTupleShape).plainToInstance({
        map: [
            ['one', {numProp: 4, strPop: 'value1'}],
        ],
    });

    t.true(result.map instanceof Map);
    t.is(result.map.get('one')?.numProp, 4);
});

test('Map with tuple shape converts to JSON', t => {
    const object = new DictionaryTupleShape();
    object.map = new Map<string, Simple>([
        ['one', new Simple({numProp: 4, strProp: 'delta'})],
    ]);
    const result = decoverto.type(DictionaryTupleShape).instanceToPlain(object);
    t.true(result.map instanceof Array);
    t.is(result.map[0][0], 'one');
    t.is(result.map[0][1].numProp, 4);
});

@model()
class KeyAndValueEdgeCasesTest {

    @property(map(Any, Any, {shape: MapShape.Array}))
    map: Map<any, any>;
}

test('Map from JSON preserves null keys', t => {
    const result = decoverto.type(KeyAndValueEdgeCasesTest).plainToInstance({
        map: [
            {key: null, value: 'yes'},
        ],
    });
    t.true(result.map.has(null));
    t.is(result.map.get(null), 'yes');
});

test('Map from JSON preserves null values', t => {
    const result = decoverto.type(KeyAndValueEdgeCasesTest).plainToInstance({
        map: [
            {key: 'yes', value: null},
        ],
    });
    t.is(result.map.get('yes'), null);
});

test('Map to JSON preserves null keys', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        [null, 'yes'],
    ]);
    const result = decoverto.type(KeyAndValueEdgeCasesTest).instanceToPlain(subject);
    t.is(result.map[0].key, null);
    t.is(result.map[0].value, 'yes');
});

test('Map to JSON preserves null values', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        ['yes', null],
    ]);
    const result = decoverto.type(KeyAndValueEdgeCasesTest).instanceToPlain(subject);
    t.is(result.map[0].key, 'yes');
    t.is(result.map[0].value, null);
});

test('Map to JSON, undefined keys turn into null', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        [undefined, 'yes'],
    ]);
    const result = decoverto.type(KeyAndValueEdgeCasesTest).instanceToPlain(subject);
    t.is(result.map[0].key, null);
    t.is(result.map[0].value, 'yes');
});

test('Map to JSON, undefined values turn into null', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        ['yes', undefined],
    ]);
    const result = decoverto.type(KeyAndValueEdgeCasesTest).instanceToPlain(subject);
    t.is(result.map[0].key, 'yes');
    t.is(result.map[0].value, null);
});

test('Map from JSON with array shape errors when an object shape is provided', t => {
    t.throws(() => {
        decoverto.type(KeyAndValueEdgeCasesTest).plainToInstance({
            map: {key: 'value'},
        });
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Object',
            path: `${KeyAndValueEdgeCasesTest.name}.map`,
            expectedType: 'Array notation',
        }),
    });
});

@model()
class DictArrayMap {
    @property(map(() => String, array(() => Simple), {shape: MapShape.Object}))
    prop: Map<string, Array<Simple>>;

    getSetSize() {
        return this.prop.size;
    }
}

test('Map with an array as value converts from JSON', t => {
    const result = decoverto.type(DictArrayMap).rawToInstance(
        JSON.stringify(
            {
                prop: {
                    one: [{strProp: 'delta', numProp: 4}],
                    two: [{strProp: 'gamma', numProp: 7}, {strProp: 'alpha', numProp: 2}],
                },
            },
        ),
    );

    t.true(result instanceof DictArrayMap);
    t.not(result.prop, undefined);
    t.true(result.prop instanceof Map);
    t.is(result.prop.size, 2);
    t.is(result.getSetSize(), 2);
    t.is(result.prop.get('one')?.length, 1);
    t.is(result.prop.get('one')?.[0].foo(), 'delta-4');
    t.is(result.prop.get('two')?.length, 2);
    t.is(result.prop.get('two')?.[0].foo(), 'gamma-7');
    t.is(result.prop.get('two')?.[1].foo(), 'alpha-2');
});

test('Map with an array as value converts to JSON', t => {
    const object = new DictArrayMap();
    object.prop = new Map<string, Array<Simple>>([
        ['one', [new Simple({strProp: 'delta', numProp: 4})]],
        ['two', [
            new Simple({strProp: 'gamma', numProp: 7}),
            new Simple({strProp: 'alpha', numProp: 2}),
        ]],
    ]);
    const result = decoverto.type(DictArrayMap).instanceToRaw(object);

    t.is(result, JSON.stringify({
        prop: {
            one: [{strProp: 'delta', numProp: 4}],
            two: [{strProp: 'gamma', numProp: 7}, {strProp: 'alpha', numProp: 2}],
        },
    }));
});

test('Map friendly name is correct', t => {
    const mapConverter = map(() => String, () => Simple, {shape: MapShape.Array});
    t.is(mapConverter.getFriendlyName(), 'Map<String, Simple>');
});

@model()
class MapAny {

    @property(map(Any, Any, {shape: MapShape.Array}))
    map: Map<any, any>;
}

test('Map<any, any> should convert to instance', t => {
    const key1 = /\w+/gm;
    const key2 = new URL('https://example.com');
    const value1 = new URL('https://value.com');
    const result = decoverto.type(MapAny).plainToInstance({
        map: [
            {key: key1, value: value1},
            {key: key2, value: 'string'},
        ],
    });

    t.true(result.map instanceof Map);
    t.is(result.map.get(key1), value1);
    t.is(result.map.get(key2), 'string');
});

test('Map<any, any> should convert to plain', t => {
    const subject = new MapAny();
    const key1 = /d/g;
    const key2 = new URL('https://example.com');
    const value1 = new URL('https://value.com');
    subject.map = new Map<any, any>([
        [key1, value1],
        [key2, 'string'],
    ]);

    const result = decoverto.type(MapAny).instanceToPlain(subject);
    t.deepEqual(result, {
        map: [
            {key: key1, value: value1},
            {key: key2, value: 'string'},
        ],
    });
});
