import test from 'ava';

import {Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown on no thunk, no custom converters, and a complex reflected \
type`, t => {
    t.throws(() => {
        @model()
        class NoThunkNoCustomConvertersComplexReflect {
            @property()
            complex: string | boolean | null | URL;
        }
        use(NoThunkNoCustomConvertersComplexReflect);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsObject', {
            typeName: 'NoThunkNoCustomConvertersComplexReflect',
            property: 'complex',
        }),
    });
});

test(`An error should be thrown on no thunk, toInstance, and a complex reflected \
type`, t => {
    t.throws(() => {
        @model()
        class NoThunkToInstanceComplexReflect {
            @property()
            complex: string | boolean | null | URL;
        }
        use(NoThunkToInstanceComplexReflect);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsObject', {
            typeName: 'NoThunkToInstanceComplexReflect',
            property: 'complex',
        }),
    });
});

test(`An error should be thrown on no thunk, toPlain, and a complex reflected \
type`, t => {
    t.throws(() => {
        @model()
        class NoThunkToPlainComplexReflect {
            @property()
            complex: string | boolean | null | URL;
        }
        use(NoThunkToPlainComplexReflect);
    }, {
        message: getDiagnostic('propertyReflectedTypeIsObject', {
            typeName: 'NoThunkToPlainComplexReflect',
            property: 'complex',
        }),
    });
});

test(`An error should not be thrown on thunk, no custom converters, and a simple\
reflected type`, t => {
    t.notThrows(() => {
        @model()
        class NoThunkNoConvertersSimpleReflect {
            @property()
            complex: string;
        }
        use(NoThunkNoConvertersSimpleReflect);
    });
});

test(`An error should not be thrown on thunk, no custom converters, and a complex\
reflected type`, t => {
    t.notThrows(() => {
        @model()
        class ThunkNoConvertersComplexReflect {
            @property(() => String)
            complex: string | boolean | null | URL;
        }
        use(ThunkNoConvertersComplexReflect);
    });
});

test(`An error should not be thrown on custom converters, no thunk, and a complex\
reflected type`, t => {
    t.notThrows(() => {
        @model()
        class CustomConvertersNoThunkComplexReflect {
            @property({toInstance: () => '', toPlain: () => ''})
            complex: string | boolean | null | URL;
        }
        use(CustomConvertersNoThunkComplexReflect);
    });
});

test(`An error should not be thrown on both custom converters and thunk with a complex\
reflected type`, t => {
    t.notThrows(() => {
        @model()
        class CustomConvertersThunkComplexReflect {
            @property(() => String, {toInstance: () => '', toPlain: () => ''})
            complex: string | boolean | null | URL;
        }
        use(CustomConvertersThunkComplexReflect);
    });
});

@model()
class NameDifferenceSpec {

    @property(() => String, {plainName: 'property'})
    classProperty: string;
}

test('Difference in naming between class property and plain should be handled by toInstance', t => {
    const result = new Decoverto().type(NameDifferenceSpec).plainToInstance({
        property: 'hello',
    });
    t.is(result.classProperty, 'hello');
    t.is((result as any).property, undefined);
});

test('Difference in naming between class property and plain should be handled by toPlain', t => {
    const testSubject = new NameDifferenceSpec();
    testSubject.classProperty = 'hello';
    const result = new Decoverto().type(NameDifferenceSpec).instanceToPlain(testSubject);
    t.is(result.property, 'hello');
    t.is(result.classProperty, undefined);
});

test('@property on a static property should error', t => {
    t.throws(() => {
        @model()
        class StaticPropertySpec {

            @property()
            static static: string;
        }
        use(StaticPropertySpec);
    }, {
        message: getDiagnostic('propertyCannotBeUsedOnStaticProperty', {
            typeName: 'StaticPropertySpec',
            property: 'static',
        }),
    });
});

test('@property on a static method should error', t => {
    t.throws(() => {
        @model()
        class StaticMethodSpec {

            @property()
            static static(): void {
                // Nothing
            }
        }
        use(StaticMethodSpec);
    }, {
        message: getDiagnostic('propertyCannotBeUsedOnStaticMethod', {
            typeName: 'StaticMethodSpec',
            property: 'static',
        }),
    });
});

test('@property on an instance method should error', t => {
    t.throws(() => {
        @model()
        class InstanceMethodSpec {

            @property()
            instance(): void {
                // Nothing
            }
        }
        use(InstanceMethodSpec);
    }, {
        message: getDiagnostic('propertyCannotBeUsedOnInstanceMethod', {
            typeName: 'InstanceMethodSpec',
            property: 'instance',
        }),
    });
});
