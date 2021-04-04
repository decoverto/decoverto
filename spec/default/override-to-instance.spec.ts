import test from 'ava';

import {array, Decoverto, model, property} from '../../src';

const decoverto = new Decoverto();

@model()
class Person {
    @property({toInstance: () => 'Mark'})
    firstName: string;

    @property(() => String, {toInstance: () => 'Foreman'})
    lastName: string;

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}

const simpleJson = '{ "firstName": "John", "lastName": "Doe" }';

test('rawToInstance on @property({toInstance: ...}) should use the overriding converter', t => {
    const result = decoverto.type(Person)
        .rawToInstance(simpleJson);
    t.is(result.firstName, 'Mark');
    t.is(result.lastName, 'Foreman');
});

test('rawToInstance @property({toInstance: ...}) result should have the correct type', t => {
    const result = decoverto.type(Person)
        .rawToInstance(simpleJson);
    t.true(result instanceof Person);
});

test('rawToInstance @property({toInstance: ...}) result should have callable methods', t => {
    const result = decoverto.type(Person)
        .rawToInstance(simpleJson);
    t.is(result.getFullName(), 'Mark Foreman');
});

test(`instanceToRaw @property({toInstance: ...}) should not be affected by overriding toInstance\
`, t => {
    const result = new Person();
    result.firstName = 'John';
    result.lastName = 'Doe';
    t.is(
        decoverto.type(Person).instanceToRaw(result),
        '{"firstName":"John","lastName":"Doe"}',
    );
});

test(`plainToInstance @property({toInstance: ..., toPlain: ...}) with complex type uses the \
overriding toInstance function`, t => {
    t.notThrows(() => {
        @model()
        class ToPlainComplexType {
            @property({toInstance: () => false, toPlain: () => true})
            complex: boolean | string | number | URL;
        }

        const typeHandler = decoverto.type(ToPlainComplexType);
        t.false(typeHandler.plainToInstance({complex: ''}).complex);
    });
});

@model()
class ArrayToInstanceTest {
    @property(array(() => Number), {
        toInstance: (data: string) => data.split(',').map((v) => parseInt(v, 10)),
    })
    nums: Array<number>;

    @property()
    str: string;

    sum() {
        return this.nums.reduce((sum, cur) => sum + cur, 0);
    }
}

const arrayJson = '{ "nums": "1,2,3,4,5", "str": "Some string" }';
const arrayToInstanceHandler = decoverto.type(ArrayToInstanceTest);

test(`rawToInstance on @property(array(() => Number), {toInstance: ...}) should use the toInstance \
function`, t => {
    const result = arrayToInstanceHandler.rawToInstance(arrayJson);
    t.deepEqual(result.nums, [1, 2, 3, 4, 5]);
    t.is(result.str, 'Some string');
});

test(`rawToInstance @property(array(() => Number), {toInstance: ...}) result should have \
callable methods`, t => {
    const result = arrayToInstanceHandler.rawToInstance(arrayJson);
    t.is(result.sum?.(), 15);
});

test(`instanceToRaw @property(array(() => Number), {toInstance: ...}) should not be affected \
by overriding toInstance`, t => {
    const result = arrayToInstanceHandler.instanceToRaw(
        arrayToInstanceHandler.rawToInstance(arrayJson),
    );
    t.is(result, '{"nums":[1,2,3,4,5],"str":"Some string"}');
});

test('toInstance @property(array(() => Class), {toInstance: function}) should succeed', t => {
    @model()
    class Inner {
        @property()
        prop: string;

        woo(): string {
            return 'hoo';
        }
    }

    function objArrayToInstance(
        values: Array<{prop: string; shouldConvertToObject: boolean}> | undefined,
    ) {
        if (values === undefined) {
            return;
        }

        return decoverto.type(Inner).plainToInstanceArray(
            values.filter(value => value.shouldConvertToObject),
        );
    }

    @model()
    class Obj {
        @property(array(() => Inner), {toInstance: objArrayToInstance})
        inners: Array<Inner>;

        @property()
        str: string;
    }

    const result = decoverto.type(Obj).rawToInstance(JSON.stringify({
        inners: [
            {
                prop: 'something',
                shouldConvertToObject: false,
            },
            {
                prop: 'gogo',
                shouldConvertToObject: true,
            },
        ],
        str: 'Text',
    }));

    t.not(result, undefined);
    t.true(result instanceof Obj);
    t.is(result.str, 'Text');
    t.is(result.inners.length, 1);
    t.true(result.inners[0] instanceof Inner);
    t.is((result.inners[0] as any).shouldConvertToObject, undefined);
    t.is(result.inners[0].prop, 'gogo');
    t.is(result.inners[0].woo(), 'hoo');
});
