import test from 'ava';

import {array, Decoverto, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {Everything} from '../utils/everything';

const decoverto = new Decoverto();

test('quoted builtins should parse', t => {
    t.is(decoverto.type(String).rawToInstance('"str"'), 'str');
    t.is(decoverto.type(Number).rawToInstance('45834'), 45834);
    t.is(decoverto.type(Boolean).rawToInstance('true'), true);

    const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
    t.deepEqual(decoverto.type(ArrayBuffer).rawToInstance('"畤慰"'), dataBuffer.buffer);
    t.deepEqual(
        decoverto.type(DataView).rawToInstance('"畤慰"'),
        new DataView(dataBuffer.buffer),
    );
    t.deepEqual(decoverto.type(Uint8Array).rawToInstance('[100,117,112,97]'), dataBuffer);
});

test('quoted builtins should convert to JSON', t => {
    t.is(decoverto.type(String).instanceToRaw('str'), '"str"');
    t.is(decoverto.type(Number).instanceToRaw(45834), '45834');
    t.is(decoverto.type(Boolean).instanceToRaw(true), 'true');

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt8(0, 100);
    view.setInt8(1, 117);
    view.setInt8(2, 112);
    view.setInt8(3, 97);
    t.is(decoverto.type(ArrayBuffer).instanceToRaw(buffer), '"畤慰"');
    t.is(decoverto.type(DataView).instanceToRaw(view), '"畤慰"');
    t.is(decoverto.type(Uint8Array).instanceToRaw(new Uint8Array(buffer)), '[100,117,112,97]');
});

@model()
class Person {
    @property()
    firstName: string;

    @property()
    lastName: string;

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}

test('Converting a single class from JSON should succeed', t => {
    const result = decoverto
        .type(Person)
        .rawToInstance('{ "firstName": "John", "lastName": "Doe" }');
    t.true(result instanceof Person);
    t.not(result.getFullName.bind(result), undefined);
    t.is(result.getFullName(), 'John Doe');
});

test('Single class converted to JSON should contain all data', t => {
    const person = new Person();
    person.firstName = 'John';
    person.lastName = 'Doe';
    t.is(
        decoverto.type(Person).instanceToRaw(person),
        '{"firstName":"John","lastName":"Doe"}',
    );
});

test('All basic types should be able to be converted from json', t => {
    const everything = Everything.create();
    const object = decoverto.type(Everything).rawToInstance(JSON.stringify(everything));
    t.deepEqual(object, Everything.expected());
});

test('All basic types should be able to be converted to json', t => {
    const everything = Everything.create();
    const json = decoverto.type(Everything).instanceToRaw(new Everything(everything));
    t.deepEqual(json, JSON.stringify(everything));
});

test('class with defaults in property expression should use defaults', t => {
    @model()
    class WithDefaults {
        @property()
        num: number = 2;

        @property()
        str: string = 'Hello world';

        @property()
        bool: boolean = true;

        @property(array(() => String))
        arr: Array<string> = [];

        @property()
        present: number = 10;
    }

    const parsed = decoverto.type(WithDefaults).rawToInstance('{"present":5}');
    const expected = new WithDefaults();
    expected.present = 5;
    t.deepEqual(parsed, expected);
});

test('class with defaults in constructors should use defaults', t => {
    @model()
    class WithCtr {
        @property()
        num: number;

        @property()
        str: string;

        @property()
        bool: boolean;

        @property(array(() => String))
        arr: Array<string>;

        @property()
        present: number;

        constructor() {
            this.num = 2;
            this.str = 'Hello world';
            this.bool = true;
            this.arr = [];
            this.present = 10;
        }
    }

    const parsed = decoverto.type(WithCtr).rawToInstance('{"present":5}');
    const expected = new WithCtr();
    expected.present = 5;
    t.deepEqual(parsed, expected);
});

@model()
class SomeClass {
    private _prop: string = 'value';
    @property()
    get prop(): string {
        return this._prop;
    }

    set prop(val: string) {
        this._prop = val;
    }

    private _getterOnly: string = 'getter';
    @property()
    get getterOnly(): string {
        return this._getterOnly;
    }

    private _setterOnly: string = 'setter';
    @property()
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

test('toPlain should work for class with getters and setters', t => {
    const json = decoverto.type(SomeClass).instanceToRaw(new SomeClass());
    t.is(json, '{"prop":"value","getterOnly":"getter"}');
});

test('should parse from JSON', t => {
    const parsed = decoverto.type(SomeClass).rawToInstance(
        '{"prop":"other value","setterOnly":"ok"}',
    );

    const expected = new SomeClass();
    expected.prop = 'other value';
    expected.setterOnly = 'ok';
    t.deepEqual(parsed, expected);
});

test('Creating a type handler for an object without prototype should error', t => {
    t.throws(() => decoverto.type(Object.create(null)), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: Object.create(null),
        }),
    });
});

@model()
class Bar {
}

@model()
class Foo {

    @property(() => Bar)
    bar?: Bar | null;
}

test('Conversion of model on null should succeed', t => {
    const subject = new Foo();
    subject.bar = null;
    const result = decoverto.type(Foo).instanceToPlain(subject);

    t.is(result.bar, null);
});

test('Conversion of model on undefined should succeed', t => {
    const result = decoverto.type(Foo).instanceToPlain(new Foo());

    t.is(result.bar, undefined);
});
