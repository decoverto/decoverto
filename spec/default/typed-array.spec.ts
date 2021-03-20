import test, {Macro} from 'ava';

import {Constructor, DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

@jsonObject()
class TypedArraySpec {

    @jsonProperty(() => Float32Array)
    float32?: Float32Array | null;

    @jsonProperty(() => Float64Array)
    float64?: Float64Array | null;

    @jsonProperty(() => Int8Array)
    int8?: Int8Array | null;

    @jsonProperty(() => Uint8Array)
    uint8?: Uint8Array | null;

    @jsonProperty(() => Uint8ClampedArray)
    uint8Clamped?: Uint8ClampedArray | null;

    @jsonProperty(() => Int16Array)
    int16?: Int16Array | null;

    @jsonProperty(() => Uint16Array)
    uint16?: Uint16Array | null;

    @jsonProperty(() => Int32Array)
    int32?: Int32Array | null;

    @jsonProperty(() => Uint32Array)
    uint32?: Uint32Array | null;

    convertToHumanReadable(): TypedArrayObjectData {
        const result = {} as TypedArrayObjectData;

        typedArrayPropertyMap.forEach(([property]) => {
            const value = this[property];
            result[property] = value == null ? value : Array.from(value);
        });

        return result;
    }
}

type TypedArraySpecProperties = Exclude<keyof TypedArraySpec, 'convertToHumanReadable'>;

const typedArrayPropertyMap: Array<[TypedArraySpecProperties, Constructor<any>]> = [
    ['float32', Float32Array],
    ['float64', Float64Array],
    ['int8', Int8Array],
    ['uint8', Uint8Array],
    ['uint8Clamped', Uint8ClampedArray],
    ['int16', Int16Array],
    ['uint16', Uint16Array],
    ['int32', Int32Array],
    ['uint32', Uint32Array],
];

const decoratedJson = new DecoratedJson();

const passThroughMacro = createPassThroughMacro({
    class: TypedArraySpec,
    createSubject: value => {
        return typedArrayPropertyMap.reduce((acc, curr) => {
            acc[curr[0]] = value;

            return acc;
        }, {} as {[k in TypedArraySpecProperties]: any});
    },
});

test('Typed arrays', passThroughMacro, {
    type: 'fromJson',
    value: null,
});

test('Typed arrays', passThroughMacro, {
    type: 'toJson',
    value: null,
});

test('Typed arrays', passThroughMacro, {
    type: 'fromJson',
    value: undefined,
});

test('Typed arrays', passThroughMacro, {
    type: 'toJson',
    value: undefined,
});

type TypedArrayJsonData = {[k in TypedArraySpecProperties]?: Array<number | string> | null};
type TypedArrayObjectData = {[k in TypedArraySpecProperties]?: Array<number> | null};

interface FromJsonMacro {
    subject: TypedArrayJsonData;
    expected: TypedArrayObjectData;
}

interface ToJsonMacro {
    subject: TypedArrayObjectData;
    expected: TypedArrayJsonData;
}

const fromJsonMacro: Macro<[FromJsonMacro]> = (t, options) => {
    const {expected, subject} = options;
    const result = decoratedJson.type(TypedArraySpec).parse(subject);
    const testProperty = (constructor: Constructor<any>, property: TypedArraySpecProperties) => {
        const actualValue = result[property];
        const expectedValue = expected[property];

        if (actualValue == null) {
            t.is<any>(actualValue, expectedValue);
            return;
        }

        t.true(actualValue instanceof constructor, `Expect ${property} to be instance of ${
            constructor.name}.`);
        // First check the more human readable version for a nicer diff
        t.deepEqual(Array.from(actualValue), expectedValue, `Expect ${property} to be equal`);
        // Check the TypedArray. Just in case since the previous check should catch any difference
        t.deepEqual(actualValue, new constructor(expectedValue), `Expect ${property} to be equal`);
    };

    typedArrayPropertyMap.forEach(([property, constructor]) => {
        testProperty(constructor, property);
    });
};

const toJsonMacro: Macro<[ToJsonMacro]> = (t, options) => {
    const {expected, subject: subjectValues} = options;
    const convertToTypedArray =
        (constructor: Constructor<any>, property: TypedArraySpecProperties) => {
            subjectValues[property] = new constructor(subjectValues[property]);
        };

    typedArrayPropertyMap.forEach(([property, constructor]) => {
        convertToTypedArray(constructor, property);
    });

    const subject = Object.assign(new TypedArraySpec(), subjectValues);
    const actual = decoratedJson.type(TypedArraySpec).toPlainJson(subject);
    t.deepEqual(actual, expected);
};

test('Typed arrays from JSON should process valid simple values', fromJsonMacro, {
    subject: {
        float32: [1.5],
        float64: [1.5],
        int8: [1],
        uint8: [1],
        uint8Clamped: [300],
        int16: [1],
        uint16: [1],
        int32: [1],
        uint32: [1],
    },
    expected: {
        float32: [1.5],
        float64: [1.5],
        int8: [1],
        uint8: [1],
        uint8Clamped: [255],
        int16: [1],
        uint16: [1],
        int32: [1],
        uint32: [1],
    },
});

test('Typed arrays from JSON should round down correctly', fromJsonMacro, {
    subject: {
        float32: [1.5],
        float64: [1.5],
        int8: [1.5],
        uint8: [1.5],
        uint8Clamped: [1.4],
        int16: [1.5],
        uint16: [1.5],
        int32: [1.5],
        uint32: [1.5],
    },
    expected: {
        float32: [1.5],
        float64: [1.5],
        int8: [1],
        uint8: [1],
        uint8Clamped: [1],
        int16: [1],
        uint16: [1],
        int32: [1],
        uint32: [1],
    },
});

test('Typed arrays from JSON should round up correctly', fromJsonMacro, {
    subject: {
        float32: [1.5],
        float64: [1.5],
        int8: [1.5],
        uint8: [1.5],
        uint8Clamped: [1.5],
        int16: [1.5],
        uint16: [1.5],
        int32: [1.5],
        uint32: [1.5],
    },
    expected: {
        float32: [1.5],
        float64: [1.5],
        int8: [1],
        uint8: [1],
        uint8Clamped: [2],
        int16: [1],
        uint16: [1],
        int32: [1],
        uint32: [1],
    },
});

test('Typed arrays from JSON should handle NaN, +0, -0, +∞, and -∞', fromJsonMacro, {
    subject: {
        float32: ['NaN', 0, '-0', '+∞', '-∞'],
        float64: ['NaN', 0, '-0', '+∞', '-∞'],
        int8: [0, 0, 0, 0, 0],
        uint8: [0, 0, 0, 0, 0],
        uint8Clamped: [0, 0, 0, 255, 0],
        int16: [0, 0, 0, 0, 0],
        uint16: [0, 0, 0, 0, 0],
        int32: [0, 0, 0, 0, 0],
        uint32: [0, 0, 0, 0, 0],
    },
    expected: {
        float32: [NaN, 0, -0, Infinity, -Infinity],
        float64: [NaN, 0, -0, Infinity, -Infinity],
        int8: [0, 0, 0, 0, 0],
        uint8: [0, 0, 0, 0, 0],
        uint8Clamped: [0, 0, 0, 255, 0],
        int16: [0, 0, 0, 0, 0],
        uint16: [0, 0, 0, 0, 0],
        int32: [0, 0, 0, 0, 0],
        uint32: [0, 0, 0, 0, 0],
    },
});

const fromJsonNotAnArrayError: Macro<[keyof TypedArraySpec]> = (t, property) => {
    const invalidValues = ['', true, new Date()];
    const typeHandler = decoratedJson.type(TypedArraySpec);

    invalidValues.forEach(invalidValue => {
        t.throws(() => typeHandler.parse({[property]: invalidValue}), {
            message: getDiagnostic('invalidValueError', {
                path: `${TypedArraySpec.name}.${property}`,
                actualType: invalidValue.constructor.name,
                expectedType: 'a numeric array',
            }),
        }, `Value '${invalidValue}' was accepted on property ${property}`);
    });
};
fromJsonNotAnArrayError.title = (providedTitle, property) => {
    return `Typed arrays from JSON should error when the source value is not an array on property ${
        property}`;
};

typedArrayPropertyMap.forEach(([property]) => {
    test(fromJsonNotAnArrayError, property);
});

test('Typed arrays to JSON should process valid values', toJsonMacro, {
    type: 'fromJson',
    subject: {
        float32: [1.5],
        float64: [1.5],
        int8: [1.5],
        uint8: [1.5],
        uint8Clamped: [300.5],
        int16: [1.5],
        uint16: [1.5],
        int32: [1.5],
        uint32: [1.5],
    },
    expected: {
        float32: [1.5],
        float64: [1.5],
        int8: [1],
        uint8: [1],
        uint8Clamped: [255],
        int16: [1],
        uint16: [1],
        int32: [1],
        uint32: [1],
    },
});

test('Typed array to JSON should error if the source value does not match the expected type', t => {
    t.throws(() => {
        const subject = new TypedArraySpec();
        subject.int8 = new Float32Array([5]) as any;
        decoratedJson.type(TypedArraySpec).stringify(subject);
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Float32Array',
            expectedType: 'Int8Array',
            path: 'TypedArraySpec.int8',
        }),
    });
});

test('Typed arrays to JSON should handle NaN, +0, -0, +∞, and -∞', toJsonMacro, {
    subject: {
        float32: [NaN, 0, -0, Infinity, -Infinity],
        float64: [NaN, 0, -0, Infinity, -Infinity],
        int8: [5, -5],
        uint8: [5],
        uint8Clamped: [5],
        int16: [5, -5],
        uint16: [5],
        int32: [5, -5],
        uint32: [5],
    },
    expected: {
        float32: ['NaN', 0, '-0', '+∞', '-∞'],
        float64: ['NaN', 0, '-0', '+∞', '-∞'],
        int8: [5, -5],
        uint8: [5],
        uint8Clamped: [5],
        int16: [5, -5],
        uint16: [5],
        int32: [5, -5],
        uint32: [5],
    },
});

const fromJsonAndBackShouldEqualMacro: Macro<[TypedArrayObjectData]> = (t, data) => {
    const expected = new TypedArraySpec();
    typedArrayPropertyMap.forEach(([property, constructor]) => {
        expected[property] = new constructor(data[property]);
    });
    const typeHandler = decoratedJson.type(TypedArraySpec);
    const actual = typeHandler.parse(typeHandler.stringify(expected));
    const humanReadableActual = actual.convertToHumanReadable();
    const humanReadableExpected = expected.convertToHumanReadable();

    t.deepEqual(humanReadableActual, humanReadableExpected);
    t.deepEqual(actual, expected);
};

test('Typed arrays converted to JSON and back should equal', fromJsonAndBackShouldEqualMacro, {
    float32: [5, 0.5, NaN, 0, -0, Infinity, -Infinity],
    float64: [5, 0.5, NaN, 0, -0, Infinity, -Infinity],
    int8: [5, 0, -0],
    uint8: [5, 0],
    uint8Clamped: [5, 0],
    int16: [5, 0, -0],
    uint16: [5, 0],
    int32: [5, 0, -0],
    uint32: [5, 0],
});
