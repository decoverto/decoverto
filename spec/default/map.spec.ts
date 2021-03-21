import test from 'ava';

import {
    Any,
    array,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    map,
    MapShape,
} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

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

@jsonObject()
class DictMap {
    @jsonProperty(map(() => String, () => Simple, {shape: MapShape.Object}))
    prop: Map<string, Simple>;

    getSetSize() {
        return this.prop.size;
    }
}

const passThroughMacro = createPassThroughMacro({
    class: DictMap,
    createSubject: value => ({prop: value}),
});

test('@jsonProperty(map(...))', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('@jsonProperty(map(...))', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('@jsonProperty(map(...))', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('@jsonProperty(map(...))', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

test('Map with dictionary shape converts from JSON', t => {
    const result = decoratedJson.type(DictMap).parse(
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

test('Map with dictionary shape converts to JSON', t => {
    const object = new DictMap();
    object.prop = new Map<string, Simple>([
        ['one', new Simple({strProp: 'delta', numProp: 4})],
        ['two', new Simple({strProp: 'gamma', numProp: 7})],
    ]);
    const result = decoratedJson.type(DictMap).stringify(object);

    t.is(result, JSON.stringify({
        prop: {
            one: {strProp: 'delta', numProp: 4},
            two: {strProp: 'gamma', numProp: 7},
        },
    }));
});

test('Map from JSON with dictionary shape errors when an array type is provided', t => {
    t.throws(() => {
        decoratedJson.type(DictMap).parse({
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

@jsonObject()
class DictionaryArrayShape {
    @jsonProperty(map(() => String, () => Simple, {shape: MapShape.Array}))
    map: Map<string, Simple>;
}

test('Map with array shape converts from JSON', t => {
    const result = decoratedJson.type(DictionaryArrayShape).parse({
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
    const result = decoratedJson.type(DictionaryArrayShape).toPlainJson(object);
    t.true(result.map instanceof Array);
    t.is(result.map[0].key, 'one');
    t.is(result.map[0].value.numProp, 4);
});

@jsonObject()
class KeyAndValueEdgeCasesTest {

    @jsonProperty(map(Any, Any, {shape: MapShape.Array}))
    map: Map<any, any>;
}

test('Map from JSON preserves null keys', t => {
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).parse({
        map: [
            {key: null, value: 'yes'},
        ],
    });
    t.true(result.map.has(null));
    t.is(result.map.get(null), 'yes');
});

test('Map from JSON preserves null values', t => {
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).parse({
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
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).toPlainJson(subject);
    t.is(result.map[0].key, null);
    t.is(result.map[0].value, 'yes');
});

test('Map to JSON preserves null values', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        ['yes', null],
    ]);
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).toPlainJson(subject);
    t.is(result.map[0].key, 'yes');
    t.is(result.map[0].value, null);
});

test('Map to JSON, undefined keys turn into null', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        [undefined, 'yes'],
    ]);
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).toPlainJson(subject);
    t.is(result.map[0].key, null);
    t.is(result.map[0].value, 'yes');
});

test('Map to JSON, undefined values turn into null', t => {
    const subject = new KeyAndValueEdgeCasesTest();
    subject.map = new Map<any, any>([
        ['yes', undefined],
    ]);
    const result = decoratedJson.type(KeyAndValueEdgeCasesTest).toPlainJson(subject);
    t.is(result.map[0].key, 'yes');
    t.is(result.map[0].value, null);
});

test('Map from JSON with array shape errors when an object shape is provided', t => {
    t.throws(() => {
        decoratedJson.type(KeyAndValueEdgeCasesTest).parse({
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

@jsonObject()
class DictArrayMap {
    @jsonProperty(map(() => String, array(() => Simple), {shape: MapShape.Object}))
    prop: Map<string, Array<Simple>>;

    getSetSize() {
        return this.prop.size;
    }
}

test('Map with an array as value converts from JSON', t => {
    const result = decoratedJson.type(DictArrayMap).parse(
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
    const result = decoratedJson.type(DictArrayMap).stringify(object);

    t.is(result, JSON.stringify({
        prop: {
            one: [{strProp: 'delta', numProp: 4}],
            two: [{strProp: 'gamma', numProp: 7}, {strProp: 'alpha', numProp: 2}],
        },
    }));
});

test('Map friendly name is correct', t => {
    const mapTypeDescriptor = map(() => String, () => Simple, {shape: MapShape.Array});
    t.is(mapTypeDescriptor.getFriendlyName(), 'Map<String, Simple>');
});
