import test from 'ava';

import {array, DecoratedJson, jsonObject, jsonProperty} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {Everything} from '../utils/everything';

const decoratedJson = new DecoratedJson();

test('quoted builtins should parse', t => {
    t.is(decoratedJson.type(String).parse('"str"'), 'str');
    t.is(decoratedJson.type(Number).parse('45834'), 45834);
    t.is(decoratedJson.type(Boolean).parse('true'), true);

    const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
    t.deepEqual(decoratedJson.type(ArrayBuffer).parse('"畤慰"'), dataBuffer.buffer);
    t.deepEqual(decoratedJson.type(DataView).parse('"畤慰"'), new DataView(dataBuffer.buffer));
    t.deepEqual(decoratedJson.type(Uint8Array).parse('[100,117,112,97]'), dataBuffer);
});

test('quoted builtins should convert to JSON', t => {
    t.is(decoratedJson.type(String).stringify('str'), '"str"');
    t.is(decoratedJson.type(Number).stringify(45834), '45834');
    t.is(decoratedJson.type(Boolean).stringify(true), 'true');

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt8(0, 100);
    view.setInt8(1, 117);
    view.setInt8(2, 112);
    view.setInt8(3, 97);
    t.is(decoratedJson.type(ArrayBuffer).stringify(buffer), '"畤慰"');
    t.is(decoratedJson.type(DataView).stringify(view), '"畤慰"');
    t.is(decoratedJson.type(Uint8Array).stringify(new Uint8Array(buffer)), '[100,117,112,97]');
});

@jsonObject()
class Person {
    @jsonProperty()
    firstName: string;

    @jsonProperty()
    lastName: string;

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}

test('Converting a single class from JSON should succeed', t => {
    const result = decoratedJson
        .type(Person)
        .parse('{ "firstName": "John", "lastName": "Doe" }');
    t.true(result instanceof Person);
    t.not(result.getFullName.bind(result), undefined);
    t.is(result.getFullName(), 'John Doe');
});

test('Single class converted to JSON should contain all data', t => {
    const person = new Person();
    person.firstName = 'John';
    person.lastName = 'Doe';
    t.is(
        decoratedJson.type(Person).stringify(person),
        '{"firstName":"John","lastName":"Doe"}',
    );
});

test('All basic types should be able to be converted from json', t => {
    const everything = Everything.create();
    const object = decoratedJson.type(Everything).parse(JSON.stringify(everything));
    t.deepEqual(object, Everything.expected());
});

test('All basic types should be able to be converted to json', t => {
    const everything = Everything.create();
    const json = decoratedJson.type(Everything).stringify(new Everything(everything));
    t.deepEqual(json, JSON.stringify(everything));
});

test('class with defaults in property expression should use defaults', t => {
    @jsonObject()
    class WithDefaults {
        @jsonProperty()
        num: number = 2;

        @jsonProperty()
        str: string = 'Hello world';

        @jsonProperty()
        bool: boolean = true;

        @jsonProperty(array(() => String))
        arr: Array<string> = [];

        @jsonProperty()
        present: number = 10;
    }

    const parsed = decoratedJson.type(WithDefaults).parse('{"present":5}');
    const expected = new WithDefaults();
    expected.present = 5;
    t.deepEqual(parsed, expected);
});

test('class with defaults in constructors should use defaults', t => {
    @jsonObject()
    class WithCtr {
        @jsonProperty()
        num: number;

        @jsonProperty()
        str: string;

        @jsonProperty()
        bool: boolean;

        @jsonProperty(array(() => String))
        arr: Array<string>;

        @jsonProperty()
        present: number;

        constructor() {
            this.num = 2;
            this.str = 'Hello world';
            this.bool = true;
            this.arr = [];
            this.present = 10;
        }
    }

    const parsed = decoratedJson.type(WithCtr).parse('{"present":5}');
    const expected = new WithCtr();
    expected.present = 5;
    t.deepEqual(parsed, expected);
});

@jsonObject()
class SomeClass {
    private _prop: string = 'value';
    @jsonProperty()
    get prop(): string {
        return this._prop;
    }

    set prop(val: string) {
        this._prop = val;
    }

    private _getterOnly: string = 'getter';
    @jsonProperty()
    get getterOnly(): string {
        return this._getterOnly;
    }

    private _setterOnly: string = 'setter';
    @jsonProperty()
    set setterOnly(val: string) {
        this._setterOnly = val;
    }

    /**
     * Exists to prevent a "'_setterOnly' is declared but its value is never read." error.
     */
    noTsIgnore(): string {
        return this._setterOnly;
    }
}

test('toJson should work for class with getters and setters', t => {
    const json = decoratedJson.type(SomeClass).stringify(new SomeClass());
    t.is(json, '{"prop":"value","getterOnly":"getter"}');
});

test('should parse from JSON', t => {
    const parsed = decoratedJson.type(SomeClass).parse(
        '{"prop":"other value","setterOnly":"ok"}',
    );

    const expected = new SomeClass();
    expected.prop = 'other value';
    expected.setterOnly = 'ok';
    t.deepEqual(parsed, expected);
});

class JustForOrganizationalPurpose {

}

@jsonObject()
class Child extends JustForOrganizationalPurpose {

}

test('Converting a class which extends an unannotated base class should succeed', t => {
    t.is(decoratedJson.type(Child).stringify(new Child()), '{}');
    t.deepEqual(decoratedJson.type(Child).parse('{}'), new Child());
});

test('Creating a type handler for an object without prototype should error', t => {
    t.throws(() => decoratedJson.type(Object.create(null)), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: Object.create(null),
        }),
    });
});

test(`Converting a class which extends an unannotated base class by providing the base class \
should fail`, t => {
    t.throws(() => decoratedJson.type(JustForOrganizationalPurpose).stringify(new Child()), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: JustForOrganizationalPurpose,
        }),
    });
    t.throws(() => decoratedJson.type(JustForOrganizationalPurpose).parse('{}'), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: JustForOrganizationalPurpose,
        }),
    });
});
