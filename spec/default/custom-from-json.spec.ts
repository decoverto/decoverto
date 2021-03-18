import test from 'ava';

import {array, DecoratedJson, jsonObject, jsonProperty} from '../../src';

const decoratedJson = new DecoratedJson();

@jsonObject()
class Person {
    @jsonProperty({fromJson: (json: any) => json[0]})
    firstName: string;

    @jsonProperty()
    lastName: string;

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}

const simpleJson = '{ "firstName": ["John"], "lastName": "Doe" }';

test('Parsing @jsonProperty({fromJson: ...}) should use the fromJson function', t => {
    const result = decoratedJson.type(Person)
        .parse(simpleJson);
    t.is(result.firstName, 'John');
    t.is(result.lastName, 'Doe');
});

test('Result of parsing @jsonProperty({fromJson: ...}) should have the correct type', t => {
    const result = decoratedJson.type(Person)
        .parse(simpleJson);
    t.true(result instanceof Person);
});

test('Result of parsing @jsonProperty({fromJson: ...}) should have with callable methods', t => {
    const result = decoratedJson.type(Person)
        .parse(simpleJson);
    t.is(result.getFullName(), 'John Doe');
});

test('Result of parsing @jsonProperty({fromJson: ...}) should not affect toJson', t => {
    const result = decoratedJson.type(Person)
        .parse(simpleJson);
    t.is(
        decoratedJson.type(Person).stringify(result),
        '{"firstName":"John","lastName":"Doe"}',
    );
});

test(`@jsonProperty({fromJson: ..., toJson: ...}) with complex type uses specified fromJson \
function`, t => {
    t.notThrows(() => {
        @jsonObject()
        class ToJsonComplexType {
            @jsonProperty({fromJson: () => false, toJson: () => true})
            complex: boolean | string | number | URL;
        }

        const typeHandler = decoratedJson.type(ToJsonComplexType);
        t.false(typeHandler.parse({complex: ''}).complex);
    });
});

@jsonObject()
class ArrayFromJsonTest {
    @jsonProperty(array(() => Number), {
        fromJson: (json: string) => json.split(',').map((v) => parseInt(v, 10)),
    })
    nums: Array<number>;

    @jsonProperty()
    str: string;

    sum() {
        return this.nums.reduce((sum, cur) => sum + cur, 0);
    }
}

const arrayJson = '{ "nums": "1,2,3,4,5", "str": "Some string" }';
const arrayFromJsonHandler = decoratedJson.type(ArrayFromJsonTest);

test(`Parsing @jsonProperty(array(() => Number), {fromJson: ...}) should use the fromJson \
function`, t => {
    const result = arrayFromJsonHandler.parse(arrayJson);
    t.deepEqual(result.nums, [1, 2, 3, 4, 5]);
    t.is(result.str, 'Some string');
});

test(`Result of parsing @jsonProperty(array(() => Number), {fromJson: ...}) should have with \
callable methods`, t => {
    const result = arrayFromJsonHandler.parse(arrayJson);
    t.is(result.sum?.(), 15);
});

test(`Result of parsing @jsonProperty(array(() => Number), {fromJson: ...}) should not affect \
toJson`, t => {
    const result = arrayFromJsonHandler.stringify(arrayFromJsonHandler.parse(arrayJson));
    t.is(result, '{"nums":[1,2,3,4,5],"str":"Some string"}');
});

test('Converting @jsonProperty(array(() => Class), {fromJson: function}) should succeed', t => {
    @jsonObject()
    class Inner {
        @jsonProperty()
        prop: string;

        woo(): string {
            return 'hoo';
        }
    }

    function objArrayFromJson(
        values: Array<{prop: string; shouldConvertToObject: boolean}> | undefined,
    ) {
        if (values === undefined) {
            return;
        }

        return decoratedJson.type(Inner).parseArray(
            values.filter(value => value.shouldConvertToObject),
        );
    }

    @jsonObject()
    class Obj {
        @jsonProperty(array(() => Inner), {fromJson: objArrayFromJson})
        inners: Array<Inner>;

        @jsonProperty()
        str: string;
    }

    const result = decoratedJson.type(Obj).parse(JSON.stringify({
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
