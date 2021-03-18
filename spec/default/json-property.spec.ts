import test from 'ava';

import {jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test.failing(`An error should be thrown on no thunk, no custom converters, and a complex reflected \
type`, t => {
    t.throws(() => {
        @jsonObject()
        class NoThunkNoCustomConvertersComplexReflect {
            @jsonProperty()
            complex: string | boolean | null | URL;
        }
        use(NoThunkNoCustomConvertersComplexReflect);
    }, {
        message: getDiagnostic('jsonPropertyReflectedTypeIsObject', {
            typeName: 'NoThunkNoCustomConvertersComplexReflect',
            property: 'complex',
        }),
    });
});

test(`An error should not be thrown on thunk, no custom converters, and a simple\
reflected type`, t => {
    t.notThrows(() => {
        @jsonObject()
        class NoThunkNoConvertersSimpleReflect {
            @jsonProperty()
            complex: string;
        }
        use(NoThunkNoConvertersSimpleReflect);
    });
});

test(`An error should not be thrown on thunk, no custom converters, and a complex\
reflected type`, t => {
    t.notThrows(() => {
        @jsonObject()
        class ThunkNoConvertersComplexReflect {
            @jsonProperty(() => String)
            complex: string | boolean | null | URL;
        }
        use(ThunkNoConvertersComplexReflect);
    });
});

test(`An error should not be thrown on custom converters, no thunk, and a complex\
reflected type`, t => {
    t.notThrows(() => {
        @jsonObject()
        class CustomConvertersNoThunkComplexReflect {
            @jsonProperty({fromJson: () => '', toJson: () => ''})
            complex: string | boolean | null | URL;
        }
        use(CustomConvertersNoThunkComplexReflect);
    });
});

test(`An error should not be thrown on both custom converters and thunk with a complex\
reflected type`, t => {
    t.notThrows(() => {
        @jsonObject()
        class CustomConvertersThunkComplexReflect {
            @jsonProperty(() => String, {fromJson: () => '', toJson: () => ''})
            complex: string | boolean | null | URL;
        }
        use(CustomConvertersThunkComplexReflect);
    });
});
