import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoratedJson = new DecoratedJson();

@jsonObject()
class ArrayBufferSpec {

    @jsonProperty(() => ArrayBuffer)
    property?: ArrayBuffer | null;
}

test('ArrayBuffer from JSON should handle undefined', t => {
    t.is(decoratedJson.type(ArrayBufferSpec).parse({property: undefined}).property, undefined);
});

test('ArrayBuffer from JSON should handle null', t => {
    t.is(decoratedJson.type(ArrayBufferSpec).parse({property: null}).property, null);
});

test('ArrayBuffer to JSON should handle undefined', t => {
    t.is(
        decoratedJson.type(ArrayBufferSpec).toPlainJson(new ArrayBufferSpec()).property,
        undefined,
    );
});

test('ArrayBuffer to JSON should handle null', t => {
    const subject = new ArrayBufferSpec();
    subject.property = null;
    t.is(decoratedJson.type(ArrayBufferSpec).toPlainJson(subject).property, null);
});

test('ArrayBuffer errors if fromJson source type is not string', t => {
    t.throws(() => decoratedJson.type(ArrayBufferSpec).parse({property: 123}), {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Number',
            expectedType: 'String',
            path: 'ArrayBufferSpec.property',
        }),
    });
});
