import test from 'ava';

import {jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown on a @jsonProperty declaration with no thunk, no custom \
converters, and no reflect metadata`, t => {
    t.throws(() => {
        @jsonObject()
        class NoReflectMetadataNoThunkNoCustomConverters {

            @jsonProperty()
            property: string;
        }
        use(NoReflectMetadataNoThunkNoCustomConverters);
    }, {
        message: getDiagnostic('jsonPropertyNoTypeNoConvertersNoReflect', {
            typeName: 'NoReflectMetadataNoThunkNoCustomConverters',
            property: 'property',
        }),
    });
});

test(`An error should not be thrown on a @jsonProperty declaration with a thunk, no custom \
converters, and no reflect metadata`, t => {
    t.notThrows(() => {
        @jsonObject()
        class ThunkNoReflectMetadataNoCustomConverters {

            @jsonProperty(() => String)
            property: string;
        }
        use(ThunkNoReflectMetadataNoCustomConverters);
    });
});

test(`An error should not be thrown on a @jsonProperty declaration with custom converters, \
no thunk, and no reflect metadata`, t => {
    t.notThrows(() => {
        @jsonObject()
        class CustomConvertersNoThunkNoReflect {

            @jsonProperty({fromJson: () => '', toJson: () => ''})
            property: string;
        }
        use(CustomConvertersNoThunkNoReflect);
    });
});
