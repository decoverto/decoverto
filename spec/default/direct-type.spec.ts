import test from 'ava';

import {DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoratedJson = new DecoratedJson();

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

const directTypeMismatchTypeHandler = decoratedJson.type(DirectTypeMismatch);

test(`An error should be thrown when the defined type and the type encountered during fromJson \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.parse({property: 15}), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});

test(`An error should be thrown when the defined type and the type encountered during toJson \
differ`, t => {
    t.throws(() => directTypeMismatchTypeHandler.toPlainJson(new DirectTypeMismatch(15)), {
        message: getDiagnostic('invalidValueError', {
            path: 'DirectTypeMismatch.property',
            actualType: 'Number',
            expectedType: 'String',
        }),
    });
});
