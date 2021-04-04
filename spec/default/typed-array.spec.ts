import test, {Macro} from 'ava';

import {Constructor, Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {createPassThroughMacro} from '../helpers/macros';

@model()
class TypedArraySpec {

    @property(() => Float32Array)
    float32?: Float32Array | null;

    @property(() => Float64Array)
    float64?: Float64Array | null;

    @property(() => Int8Array)
    int8?: Int8Array | null;

    @property(() => Uint8Array)
    uint8?: Uint8Array | null;

    @property(() => Uint8ClampedArray)
    uint8Clamped?: Uint8ClampedArray | null;

    @property(() => Int16Array)
    int16?: Int16Array | null;

    @property(() => Uint16Array)
    uint16?: Uint16Array | null;

    @property(() => Int32Array)
    int32?: Int32Array | null;

    @property(() => Uint32Array)
    uint32?: Uint32Array | null;

    convertToHumanReadable(): TypedArrayObjectData {
        const result = {} as TypedArrayObjectData;

        typedArrayPropertyMap.forEach(([propertyKey]) => {
            const value = this[propertyKey];
            result[propertyKey] = value == null ? value : Array.from(value);
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

const decoverto = new Decoverto();

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
    type: 'toInstance',
    value: null,
});

test('Typed arrays', passThroughMacro, {
    type: 'toPlain',
    value: null,
});

test('Typed arrays', passThroughMacro, {
    type: 'toInstance',
    value: undefined,
});

test('Typed arrays', passThroughMacro, {
    type: 'toPlain',
    value: undefined,
});

type TypedArrayPlainData = {[k in TypedArraySpecProperties]?: Array<number | string> | null};
type TypedArrayObjectData = {[k in TypedArraySpecProperties]?: Array<number> | null};

interface ToInstanceMacro {
    subject: TypedArrayPlainData;
    expected: TypedArrayObjectData;
}

interface ToPlainMacro {
    subject: TypedArrayObjectData;
    expected: TypedArrayPlainData;
}

const toInstanceMacro: Macro<[ToInstanceMacro]> = (t, options) => {
    const {expected, subject} = options;
    const result = decoverto.type(TypedArraySpec).plainToInstance(subject);
    const testProperty = (constructor: Constructor<any>, propertyKey: TypedArraySpecProperties) => {
        const actualValue = result[propertyKey];
        const expectedValue = expected[propertyKey];

        if (actualValue == null) {
            t.is<any>(actualValue, expectedValue);
            return;
        }

        t.true(actualValue instanceof constructor, `Expect ${propertyKey} to be instance of ${
            constructor.name}.`);
        // First check the more human readable version for a nicer diff
        t.deepEqual(Array.from(actualValue), expectedValue, `Expect ${propertyKey} to be equal`);
        // Check the TypedArray. Just in case since the previous check should catch any difference
        t.deepEqual(
            actualValue,
            new constructor(expectedValue),
            `Expect ${propertyKey} to be equal`,
        );
    };

    typedArrayPropertyMap.forEach(([propertyKey, constructor]) => {
        testProperty(constructor, propertyKey);
    });
};

const toPlainMacro: Macro<[ToPlainMacro]> = (t, options) => {
    const {expected, subject: subjectValues} = options;
    const convertToTypedArray =
        (constructor: Constructor<any>, propertyKey: TypedArraySpecProperties) => {
            subjectValues[propertyKey] = new constructor(subjectValues[propertyKey]);
        };

    typedArrayPropertyMap.forEach(([propertyKey, constructor]) => {
        convertToTypedArray(constructor, propertyKey);
    });

    const subject = Object.assign(new TypedArraySpec(), subjectValues);
    const actual = decoverto.type(TypedArraySpec).instanceToPlain(subject);
    t.deepEqual(actual, expected);
};

test('Typed arrays toInstance should process valid simple values', toInstanceMacro, {
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

test('Typed arrays toInstance should round down correctly', toInstanceMacro, {
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

test('Typed arrays toInstance should round up correctly', toInstanceMacro, {
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

test('Typed arrays to instance should handle NaN, +0, -0, +∞, and -∞', toInstanceMacro, {
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

const toInstanceNotAnArrayError: Macro<[keyof TypedArraySpec]> = (t, propertyKey) => {
    const invalidValues = ['', true, new Date()];
    const typeHandler = decoverto.type(TypedArraySpec);

    invalidValues.forEach(invalidValue => {
        t.throws(() => typeHandler.plainToInstance({[propertyKey]: invalidValue}), {
            message: getDiagnostic('invalidValueError', {
                path: `${TypedArraySpec.name}.${propertyKey}`,
                actualType: invalidValue.constructor.name,
                expectedType: 'a numeric array',
            }),
        }, `Value '${invalidValue}' was accepted on property ${propertyKey}`);
    });
};
toInstanceNotAnArrayError.title = (providedTitle, proeprtyKey) => {
    return `Typed arrays plainToInstance should error when the source value is not an array on \
property ${proeprtyKey}`;
};

typedArrayPropertyMap.forEach(([propertyKey]) => {
    test(toInstanceNotAnArrayError, propertyKey);
});

test('Typed arrays to plain should process valid values', toPlainMacro, {
    type: 'toInstance',
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

test('Typed array to raw should error if the source value does not match the expected type', t => {
    t.throws(() => {
        const subject = new TypedArraySpec();
        subject.int8 = new Float32Array([5]) as any;
        decoverto.type(TypedArraySpec).instanceToRaw(subject);
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'Float32Array',
            expectedType: 'Int8Array',
            path: 'TypedArraySpec.int8',
        }),
    });
});

test('Typed arrays to JSON should handle NaN, +0, -0, +∞, and -∞', toPlainMacro, {
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

const toInstanceAndBackShouldEqualMacro: Macro<[TypedArrayObjectData]> = (t, data) => {
    const expected = new TypedArraySpec();
    typedArrayPropertyMap.forEach(([propertyKey, constructor]) => {
        expected[propertyKey] = new constructor(data[propertyKey]);
    });
    const typeHandler = decoverto.type(TypedArraySpec);
    const actual = typeHandler.rawToInstance(typeHandler.instanceToRaw(expected));
    const humanReadableActual = actual.convertToHumanReadable();
    const humanReadableExpected = expected.convertToHumanReadable();

    t.deepEqual(humanReadableActual, humanReadableExpected);
    t.deepEqual(actual, expected);
};

test('Typed arrays converted to JSON and back should equal', toInstanceAndBackShouldEqualMacro, {
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
