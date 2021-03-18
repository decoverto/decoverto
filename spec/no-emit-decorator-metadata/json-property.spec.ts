import test from 'ava';

import {jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown when type reflection is attempted but emitDecoratorMetadata is \
disabled`, t => {
    t.throws(() => {
        @jsonObject()
        class ReflectWithoutEmitDecoratorMetadata {
            @jsonProperty()
            property: string;
        }
        use(ReflectWithoutEmitDecoratorMetadata);
    }, {
        message: getDiagnostic('jsonPropertyReflectedTypeIsNull', {
            property: 'property',
            typeName: 'ReflectWithoutEmitDecoratorMetadata',
        }),
    });
});

test(`An error should not be thrown when a thunk is specified and emitDecoratorMetadata is \
disabled`, t => {
    t.notThrows(() => {
        @jsonObject()
        class ThunkWithoutEmitDecoratorMetadata {
            @jsonProperty(() => String)
            property: string;
        }
        use(ThunkWithoutEmitDecoratorMetadata);
    });
});

test.failing(`An error should not be thrown when custom converters are specified and \
emitDecoratorMetadata is disabled`, t => {
    t.notThrows(() => {
        @jsonObject()
        class CustomConvertersWithoutEmitDecoratorMetadata {
            @jsonProperty({fromJson: () => '', toJson: () => ''})
            property: string;
        }
        use(CustomConvertersWithoutEmitDecoratorMetadata);
    });
});

test(`An error should not be thrown when both a thunk and custom converters are specified and \
emitDecoratorMetadata is disabled`, t => {
    t.notThrows(() => {
        @jsonObject()
        class ThunkAndCustomConvertersWithoutEmitDecoratorMetadata {
            @jsonProperty(() => String, {fromJson: () => '', toJson: () => ''})
            property: string;
        }
        use(ThunkAndCustomConvertersWithoutEmitDecoratorMetadata);
    });
});
