import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoverto = new Decoverto();

@jsonObject()
class DirectTypeMismatch {
    @jsonProperty(() => String)
    property: any;

    constructor(
        property: any,
    ) {
        this.property = property;
    }
}

const directTypeMismatchTypeHandler = decoverto.type(DirectTypeMismatch);

test(`An error should be thrown when the defined type and the type encountered during fromJson \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.plainToInstance({property: 15}), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});

test(`An error should be thrown when the defined type and the type encountered during toJson \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.instanceToPlain(new DirectTypeMismatch(15)), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});
