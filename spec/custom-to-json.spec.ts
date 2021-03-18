import test from 'ava';

import {array, DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

@jsonObject()
class Person {
    @jsonProperty({toJson: (value: string) => value.split(' ')})
    firstName: string;

    @jsonProperty()
    lastName: string;

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}

test(`Converting @jsonProperty({toJson: ...}) to JSON  should use the custom fromJson \
function`, t => {
    const person = new Person();
    person.firstName = 'Mulit term name';
    person.lastName = 'Surname';

    t.deepEqual(JSON.parse(decoratedJson.type(Person).stringify(person)), {
        firstName: ['Mulit', 'term', 'name'],
        lastName: 'Surname',
    });
});

test('Converting @jsonProperty({toJson: ...}) to JSON should not affect fromJson', t => {
    t.deepEqual(
        decoratedJson.type(Person).parse('{"firstName":"name","lastName":"last"}'),
        Object.assign(new Person(), {firstName: 'name', lastName: 'last'}),
    );
});

test('@jsonProperty({toJson: ...}) with complex type uses specified function', t => {
    t.notThrows(() => {
        @jsonObject()
        class ToJsonComplexType {
            @jsonProperty({toJson: () => true})
            complex: boolean | string | number | URL;
        }

        const typeHandler = decoratedJson.type(ToJsonComplexType);
        t.true(typeHandler.toPlainJson(new ToJsonComplexType()).complex);
    });
});

@jsonObject()
class ArrayToJsonTest {
    @jsonProperty(array(() => Number), {toJson: (values: Array<number>) => values.join(',')})
    nums: Array<number>;

    @jsonProperty()
    str: string;

    sum() {
        return this.nums.reduce((sum, cur) => sum + cur, 0);
    }
}

test('Parsing @jsonProperty(array(() => Number), {toJson: ...}) should use the toJsonJson \
function', t => {
    const testInstance = new ArrayToJsonTest();
    testInstance.nums = [3, 45, 34];
    testInstance.str = 'Text';

    t.deepEqual(JSON.parse(decoratedJson.type(ArrayToJsonTest).stringify(testInstance)), {
        nums: '3,45,34',
        str: 'Text',
    });
});

test(`Result of parsing @jsonProperty(array(() => Number), {fromJson: ...}) should not affect \
toJson`, t => {
    t.deepEqual(
        decoratedJson.type(ArrayToJsonTest).parse('{"nums":[4,5,6,7],"str":"string"}'),
        Object.assign(new ArrayToJsonTest(), {nums: [4, 5, 6, 7], str: 'string'}),
    );
});

test('Converting @jsonProperty(array(() => Class), {toJsonJson: function}) should succeed', t => {
    @jsonObject()
    class Inner {
        @jsonProperty()
        prop: string;

        shouldConvertToJson: boolean;

        constructor(prop: string, shouldConvertToJSon: boolean) {
            this.prop = prop;
            this.shouldConvertToJson = shouldConvertToJSon;
        }
    }

    function objArrayToJson(values: Array<Inner>) {
        return decoratedJson.type(Inner).toPlainArray(
            values.filter(value => value.shouldConvertToJson),
        );
    }

    @jsonObject()
    class Obj {
        @jsonProperty(array(() => Inner), {toJson: objArrayToJson})
        inners: Array<Inner>;

        @jsonProperty()
        str: string;
    }

    const obj = new Obj();
    obj.inners = [
        new Inner('valval', false),
        new Inner('something', true),
    ];
    obj.str = 'Text';
    const json = JSON.parse(decoratedJson.type(Obj).stringify(obj));

    t.deepEqual(json, {
        inners: [
            {
                prop: 'something',
            },
        ],
        str: 'Text',
    });
});
