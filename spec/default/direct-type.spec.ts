import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoverto = new Decoverto();

@model()
class DirectTypeMismatch {
    @property(() => String)
    property: any;

    constructor(
        propertyValue: any,
    ) {
        this.property = propertyValue;
    }
}

const directTypeMismatchTypeHandler = decoverto.type(DirectTypeMismatch);

test(`An error should be thrown when the defined type and the type encountered during toInstance \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.plainToInstance({property: 15}), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});

test(`An error should be thrown when the defined type and the type encountered during toPlain \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.instanceToPlain(new DirectTypeMismatch(15)), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});
