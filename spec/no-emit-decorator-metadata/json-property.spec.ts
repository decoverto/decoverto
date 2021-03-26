import test from 'ava';

import {model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown when type reflection is attempted but emitDecoratorMetadata is \
disabled`, t => {
    t.throws(() => {
        @model()
        class ReflectWithoutEmitDecoratorMetadata {
            @property()
            property: string;
        }
        use(ReflectWithoutEmitDecoratorMetadata);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsNull', {
            property: 'property',
            typeName: 'ReflectWithoutEmitDecoratorMetadata',
        }),
    });
});

test(`An error should not be thrown when a thunk is specified and emitDecoratorMetadata is \
disabled`, t => {
    t.notThrows(() => {
        @model()
        class ThunkWithoutEmitDecoratorMetadata {
            @property(() => String)
            property: string;
        }
        use(ThunkWithoutEmitDecoratorMetadata);
    });
});

test(`An error should not be thrown when custom converters are specified and \
emitDecoratorMetadata is disabled`, t => {
    t.notThrows(() => {
        @model()
        class CustomConvertersWithoutEmitDecoratorMetadata {
            @property({toInstance: () => '', toPlain: () => ''})
            property: string;
        }
        use(CustomConvertersWithoutEmitDecoratorMetadata);
    });
});

test(`An error should be thrown on no thunk, only toInstance, a complex type, and \
emitDecoratorMetadata disabled`, t => {
    t.throws(() => {
        @model()
        class ToInstanceOnlyWithoutEmitDecoratorMetadata {
            @property({toInstance: () => ''})
            property: string | number;
        }
        use(ToInstanceOnlyWithoutEmitDecoratorMetadata);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsNull', {
            property: 'property',
            typeName: 'ToInstanceOnlyWithoutEmitDecoratorMetadata',
        }),
    });
});

test(`An error should be thrown on no thunk, only toPlain, a complex type, and \
emitDecoratorMetadata disabled`, t => {
    t.throws(() => {
        @model()
        class ToPlainOnlyWithoutEmitDecoratorMetadata {
            @property({toPlain: () => ''})
            property: string | number;
        }
        use(ToPlainOnlyWithoutEmitDecoratorMetadata);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsNull', {
            property: 'property',
            typeName: 'ToPlainOnlyWithoutEmitDecoratorMetadata',
        }),
    });
});

test(`An error should not be thrown when both a thunk and custom converters are specified and \
emitDecoratorMetadata is disabled`, t => {
    t.notThrows(() => {
        @model()
        class ThunkAndCustomConvertersWithoutEmitDecoratorMetadata {
            @property(() => String, {toInstance: () => '', toPlain: () => ''})
            property: string;
        }
        use(ThunkAndCustomConvertersWithoutEmitDecoratorMetadata);
    });
});
