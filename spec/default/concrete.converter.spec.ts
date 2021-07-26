import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';

const decoverto = new Decoverto();

class Unknown {
}

@model()
class UnknownPropertyType {

    @property(() => Unknown)
    unknown: any;
}

test(`An error should be thrown when converting a non-object to an instance of an unknown type \
`, t => {
    const typeHandler = decoverto.type(UnknownPropertyType);
    t.throws(() => typeHandler.plainToInstance({unknown: 'bar'}), {
        message: getDiagnostic('unknownTypeError', {
            path: 'UnknownPropertyType.unknown',
            type: 'Unknown',
        }),
    });
});
