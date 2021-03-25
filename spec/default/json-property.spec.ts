import test from 'ava';

import {Decoverto, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

test(`An error should be thrown on no thunk, no custom converters, and a complex reflected \
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

test(`An error should be thrown on no thunk, fromJson, and a complex reflected \
type`, t => {
    t.throws(() => {
        @jsonObject()
        class NoThunkFromJsonComplexReflect {
            @jsonProperty()
            complex: string | boolean | null | URL;
        }
        use(NoThunkFromJsonComplexReflect);
    }, {
        message: getDiagnostic('jsonPropertyReflectedTypeIsObject', {
            typeName: 'NoThunkFromJsonComplexReflect',
            property: 'complex',
        }),
    });
});

test(`An error should be thrown on no thunk, toJson, and a complex reflected \
type`, t => {
    t.throws(() => {
        @jsonObject()
        class NoThunkToJsonComplexReflect {
            @jsonProperty()
            complex: string | boolean | null | URL;
        }
        use(NoThunkToJsonComplexReflect);
    }, {
        message: getDiagnostic('jsonPropertyReflectedTypeIsObject', {
            typeName: 'NoThunkToJsonComplexReflect',
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

@jsonObject()
class NameDifferenceSpec {

    @jsonProperty(() => String, {jsonName: 'jsonProperty'})
    classProperty: string;
}

test('Difference in naming between class property and json should be handled by toInstance', t => {
    const result = new Decoverto().type(NameDifferenceSpec).plainToInstance({
        jsonProperty: 'hello',
    });
    t.is(result.classProperty, 'hello');
    t.is((result as any).jsonProperty, undefined);
});

test('Difference in naming between class property and json should be handled by toPlain', t => {
    const testSubject = new NameDifferenceSpec();
    testSubject.classProperty = 'hello';
    const result = new Decoverto().type(NameDifferenceSpec).instanceToPlain(testSubject);
    t.is(result.jsonProperty, 'hello');
    t.is(result.classProperty, undefined);
});

test('@jsonProperty on a static property should error', t => {
    t.throws(() => {
        @jsonObject()
        class StaticPropertySpec {

            @jsonProperty()
            static static: string;
        }
        use(StaticPropertySpec);
    }, {
        message: getDiagnostic('jsonPropertyCannotBeUsedOnStaticProperty', {
            typeName: 'StaticPropertySpec',
            property: 'static',
        }),
    });
});

test('@jsonProperty on a static method should error', t => {
    t.throws(() => {
        @jsonObject()
        class StaticMethodSpec {

            @jsonProperty()
            static static(): void {
                // Nothing
            }
        }
        use(StaticMethodSpec);
    }, {
        message: getDiagnostic('jsonPropertyCannotBeUsedOnStaticMethod', {
            typeName: 'StaticMethodSpec',
            property: 'static',
        }),
    });
});

test('@jsonProperty on an instance method should error', t => {
    t.throws(() => {
        @jsonObject()
        class InstanceMethodSpec {

            @jsonProperty()
            instance(): void {
                // Nothing
            }
        }
        use(InstanceMethodSpec);
    }, {
        message: getDiagnostic('jsonPropertyCannotBeUsedOnInstanceMethod', {
            typeName: 'InstanceMethodSpec',
            property: 'instance',
        }),
    });
});
