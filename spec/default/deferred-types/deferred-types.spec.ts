import test from 'ava';

import {
    array,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    map,
    MapShape,
    set,
} from '../../../src';
import {A} from './a.model';
import {B} from './b.model';

const decoratedJson = new DecoratedJson();

@jsonObject()
class DeferredSimple {

    @jsonProperty(() => Deferred)
    deferred: any;
}

@jsonObject()
class DeferredArray {

    @jsonProperty(array(() => Deferred))
    deferred: Array<any>;
}

@jsonObject()
class DeferredMap {

    @jsonProperty(map(() => String, () => Deferred, {shape: MapShape.Array}))
    deferred: Map<string, any>;
}

@jsonObject()
class DeferredSet {

    @jsonProperty(set(() => Deferred))
    deferred: Set<any>;
}

// Must be declared beneath other classes to test deferred typed
@jsonObject()
class Deferred {

    @jsonProperty()
    name: string;
}

const simpleTypeHandler = decoratedJson.type(DeferredSimple);
const arrayTypeHandler = decoratedJson.type(DeferredArray);
const mapTypeHandler = decoratedJson.type(DeferredMap);
const setTypeHandler = decoratedJson.type(DeferredSet);

test('Converting a simple object with a not yet defined type from JSON should succeed', t => {
    const result = simpleTypeHandler.parse({
        deferred: {
            name: 'hello',
        },
    });

    t.true(result.deferred instanceof Deferred);
    t.is(result.deferred.name, 'hello');
});

test('Converting a simple object with a not yet defined type to JSON should succeed', t => {
    const root = new DeferredSimple();
    root.deferred = new Deferred();
    root.deferred.name = 'hello';
    const result = simpleTypeHandler.toPlainJson(root);

    t.is(result.deferred.name, 'hello');
});

test('Converting an array of objects with a not yet defined type from JSON should succeed', t => {
    const result = arrayTypeHandler.parse({
        deferred: [{name: 'hello'}],
    });

    t.is(result.deferred.length, 1);
    t.true(result.deferred[0] instanceof Deferred);
    t.is(result.deferred[0].name, 'hello');
});

test('Converting an array of objects with a not yet defined type to JSON should succeed', t => {
    const root = new DeferredArray();
    const deferred = new Deferred();
    deferred.name = 'hello';
    root.deferred = [deferred];
    const result = arrayTypeHandler.toPlainJson(root);

    t.is(result.deferred.length, 1);
    t.is(result.deferred[0].name, 'hello');
});

test('Converting a map with a not yet defined value type from JSON should succeed', t => {
    const result = mapTypeHandler.parse({
        deferred: [{key: 'key', value: {name: 'hello'}}],
    });

    t.is(result.deferred.size, 1);
    t.true(result.deferred instanceof Map);
    t.true(result.deferred.get('key') instanceof Deferred);
    t.is(result.deferred.get('key')?.name, 'hello');
});

test('Converting a map with a not yet defined value type to JSON should succeed', t => {
    const root = new DeferredMap();
    const deferred = new Deferred();
    deferred.name = 'hello';
    root.deferred = new Map<string, Deferred>([['key', deferred]]);
    const result = mapTypeHandler.toPlainJson(root);

    t.is(result.deferred.length, 1);
    t.is(result.deferred[0].key, 'key');
    t.is(result.deferred[0].value.name, 'hello');
});

test('Converting a set of objects with a not yet defined type from JSON should succeed', t => {
    const result = setTypeHandler.parse({
        deferred: [{name: 'hello'}],
    });

    t.is(result.deferred.size, 1);
    t.true(result.deferred instanceof Set);
    t.true(result.deferred.values().next().value instanceof Deferred);
    t.is(result.deferred.values().next().value.name, 'hello');
});

test('Converting a set of objects with a not yet defined type to JSON should succeed', t => {
    const root = new DeferredSet();
    const deferred = new Deferred();
    deferred.name = 'hello';
    root.deferred = new Set([deferred]);
    const result = setTypeHandler.toPlainJson(root);

    t.is(result.deferred.length, 1);
    t.is(result.deferred[0].name, 'hello');
});

test('Conversion should succeed on circular models in separate files', t => {
    const result = decoratedJson.type(A).parse({
        b: {
            a: {
                b: {
                    name: 'b2',
                },
                name: 'a2',
            },
            name: 'b1',
        },
        name: 'a1',
    });

    t.true(result instanceof A);
    t.is(result.name, 'a1');
    t.true(result.test());
    t.true(result.b instanceof B);
    t.is(result.b.name, 'b1');
    t.true(result.b.test());
    t.true(result.b.a instanceof A);
    t.is(result.b.a.name, 'a2');
    t.true(result.b.a.test());
    t.true(result.b.a.b instanceof B);
    t.is(result.b.a.b.name, 'b2');
    t.true(result.b.a.b.test());
});
