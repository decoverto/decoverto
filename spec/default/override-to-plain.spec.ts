import test from 'ava';

import {array, Decoverto, model, property} from '../../src';

const decoverto = new Decoverto();

@model()
class Person {
    @property({toPlain: () => 'Mark'})
    firstName: string;

    @property(() => String, {toPlain: () => 'Foreman'})
    lastName: string;
}

test(`instanceToRaw @property({toPlain: ...}) should use the overriding converter`, t => {
    const person = new Person();
    person.firstName = 'Mulit term name';
    person.lastName = 'Surname';

    t.deepEqual(JSON.parse(decoverto.type(Person).instanceToRaw(person)), {
        firstName: 'Mark',
        lastName: 'Foreman',
    });
});

test(`rawToInstance @property({toPlain: ...}) should not be affected by overriding toPlain`, t => {
    t.deepEqual(
        decoverto.type(Person).rawToInstance('{"firstName":"name","lastName":"last"}'),
        Object.assign(new Person(), {firstName: 'name', lastName: 'last'}),
    );
});

test(`instanceToPlain @property({toInstance: ..., toPlain: ...}) with complex type uses the \
overriding toPlain function`, t => {
    t.notThrows(() => {
        @model()
        class ToPlainComplexType {
            @property({toInstance: () => false, toPlain: () => true})
            complex: boolean | string | number | URL;
        }

        const typeHandler = decoverto.type(ToPlainComplexType);
        t.true(typeHandler.instanceToPlain(new ToPlainComplexType()).complex);
    });
});

@model()
class ArrayToPlainTest {
    @property(array(() => Number), {toPlain: (values: Array<number>) => values.join(',')})
    nums: Array<number>;

    @property()
    str: string;
}

test('instanceToRaw on @property(array(() => Number), {toPlain: ...}) should use the toPlain \
function', t => {
    const testInstance = new ArrayToPlainTest();
    testInstance.nums = [3, 45, 34];
    testInstance.str = 'Text';

    t.deepEqual(JSON.parse(decoverto.type(ArrayToPlainTest).instanceToRaw(testInstance)), {
        nums: '3,45,34',
        str: 'Text',
    });
});

test(`rawToInstance @property(array(() => Number), {toPlain: ...}) should not be affected \
by overriding toPlain`, t => {
    t.deepEqual(
        decoverto.type(ArrayToPlainTest).rawToInstance('{"nums":[4,5,6,7],"str":"string"}'),
        Object.assign(new ArrayToPlainTest(), {nums: [4, 5, 6, 7], str: 'string'}),
    );
});

test('toPlain @property(array(() => Class), {toPlain: function}) should succeed', t => {
    @model()
    class Inner {
        @property()
        prop: string;

        shouldConvertToPlain: boolean;

        constructor(prop: string, shouldConvertToPlain: boolean) {
            this.prop = prop;
            this.shouldConvertToPlain = shouldConvertToPlain;
        }
    }

    function objArrayToPlain(values: Array<Inner>) {
        return decoverto.type(Inner).instanceArrayToPlain(
            values.filter(value => value.shouldConvertToPlain),
        );
    }

    @model()
    class Obj {
        @property(array(() => Inner), {toPlain: objArrayToPlain})
        inners: Array<Inner>;

        @property()
        str: string;
    }

    const obj = new Obj();
    obj.inners = [
        new Inner('valval', false),
        new Inner('something', true),
    ];
    obj.str = 'Text';
    const json = JSON.parse(decoverto.type(Obj).instanceToRaw(obj));

    t.deepEqual(json, {
        inners: [
            {
                prop: 'something',
            },
        ],
        str: 'Text',
    });
});
