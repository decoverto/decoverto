import test from 'ava';

import {model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown on a @property declaration with no thunk, no custom \
converters, and no reflect metadata`, t => {
    t.throws(() => {
        @model()
        class NoReflectMetadataNoThunkNoCustomConverters {

            @property()
            property: string;
        }
        use(NoReflectMetadataNoThunkNoCustomConverters);
    }, {
        message: getDiagnostic('propertyNoTypeNoConvertersNoReflect', {
            typeName: 'NoReflectMetadataNoThunkNoCustomConverters',
            property: 'property',
        }),
    });
});

test(`An error should be thrown on a @property declaration with no thunk, a single custom \
converter (toInstance), and no reflect metadata`, t => {
    t.throws(() => {
        @model()
        class NoReflectMetadataNoThunkToInstance {

            @property({toInstance: () => ''})
            property: string;
        }
        use(NoReflectMetadataNoThunkToInstance);
    }, {
        message: getDiagnostic('propertyNoTypeNoConvertersNoReflect', {
            typeName: 'NoReflectMetadataNoThunkToInstance',
            property: 'property',
        }),
    });
});

test(`An error should be thrown on a @property declaration with no thunk, a single custom \
converter (toPlain), and no reflect metadata`, t => {
    t.throws(() => {
        @model()
        class NoReflectMetadataNoThunkToPlain {

            @property({toPlain: () => ''})
            property: string;
        }
        use(NoReflectMetadataNoThunkToPlain);
    }, {
        message: getDiagnostic('propertyNoTypeNoConvertersNoReflect', {
            typeName: 'NoReflectMetadataNoThunkToPlain',
            property: 'property',
        }),
    });
});

test(`An error should not be thrown on a @property declaration with a thunk, no custom \
converters, and no reflect metadata`, t => {
    t.notThrows(() => {
        @model()
        class ThunkNoReflectMetadataNoCustomConverters {

            @property(() => String)
            property: string;
        }
        use(ThunkNoReflectMetadataNoCustomConverters);
    });
});

test(`An error should not be thrown on a @property declaration with custom converters, \
no thunk, and no reflect metadata`, t => {
    t.notThrows(() => {
        @model()
        class CustomConvertersNoThunkNoReflect {

            @property({toInstance: () => '', toPlain: () => ''})
            property: string;
        }
        use(CustomConvertersNoThunkNoReflect);
    });
});

test('@property with converters null should error', t => {
    t.throws(() => {
        @model()
        class NullConverters {

            @property({toInstance: null, toPlain: null})
            null: string;
        }
        use(NullConverters);
    }, {
        message: getDiagnostic('propertyNoTypeNoConvertersNoReflect', {
            typeName: 'NullConverters',
            property: 'null',
        }),
    });
});
