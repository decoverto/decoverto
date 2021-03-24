import test from 'ava';

import {Converter} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

export class ThrowTypeMismatchErrorSpec extends Converter {
    test(value: any) {
        this.throwTypeMismatchError({
            path: '',
            expectedType: 'Something',
            source: value,
        });
    }

    toInstance(): any {
        throw new Error('Not implemented');
    }

    toPlain(): any {
        throw new Error('Not implemented');
    }

    getFriendlyName(): string {
        throw new Error('Not implemented');
    }
}
const throwTypeMismatchErrorSpec = new ThrowTypeMismatchErrorSpec();

test('throwTypeMismatchError should handle undefined source', t => {
    t.throws(() => {
        throwTypeMismatchErrorSpec.test(undefined);
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'undefined',
            expectedType: 'Something',
            path: '',
        }),
    });
});

test('throwTypeMismatchError should handle null source', t => {
    t.throws(() => {
        throwTypeMismatchErrorSpec.test(null);
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'undefined',
            expectedType: 'Something',
            path: '',
        }),
    });
});

test('throwTypeMismatchError should handle non-object source', t => {
    t.throws(() => {
        throwTypeMismatchErrorSpec.test('');
    }, {
        message: getDiagnostic('invalidValueError', {
            actualType: 'String',
            expectedType: 'Something',
            path: '',
        }),
    });
});
