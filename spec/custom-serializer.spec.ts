import {DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('custom member serializer', () => {
    @jsonObject()
    class Person {
        @jsonMember({serializer: (value: string) => value.split(' ')})
        firstName: string;

        @jsonMember()
        lastName: string;

        getFullName() {
            return `${this.firstName} ${this.lastName}`;
        }
    }

    beforeAll(function () {
        this.person = new Person();
        this.person.firstName = 'Mulit term name';
        this.person.lastName = 'Surname';
        this.json = JSON.parse(decoratedJson.type(Person).stringify(this.person));
    });

    it('should properly serialize', function () {
        expect(this.json).toEqual(
            {
                firstName: ['Mulit', 'term', 'name'],
                lastName: 'Surname',
            },
        );
    });

    it('should not affect deserialization', () => {
        expect(decoratedJson.type(Person).parse('{"firstName":"name","lastName":"last"}'))
            .toEqual(Object.assign(new Person(), {firstName: 'name', lastName: 'last'}));
    });
});

describe('custom array member serializer', () => {
    @jsonObject()
    class Obj {
        @jsonArrayMember(() => Number, {serializer: (values: Array<number>) => values.join(',')})
        nums: Array<number>;

        @jsonMember()
        str: string;

        sum() {
            return this.nums.reduce((sum, cur) => sum + cur, 0);
        }
    }

    beforeAll(function () {
        this.obj = new Obj();
        this.obj.nums = [3, 45, 34];
        this.obj.str = 'Text';
        this.json = JSON.parse(decoratedJson.type(Obj).stringify(this.obj));
    });

    it('should properly serialize', function () {
        expect(this.json).toEqual(
            {
                nums: '3,45,34',
                str: 'Text',
            },
        );
    });

    it('should not affect deserialization', () => {
        expect(decoratedJson.type(Obj).parse('{"nums":[4,5,6,7],"str":"string"}'))
            .toEqual(Object.assign(new Obj(), {nums: [4, 5, 6, 7], str: 'string'} as Obj));
    });
});

describe('custom delegating array member serializer', () => {
    @jsonObject()
    class Inner {
        @jsonMember()
        prop: string;

        shouldSerialize: boolean;

        constructor();
        constructor(prop: string, shouldSerialize: boolean);
        constructor(prop?: string, shouldSerialize?: boolean) {
            this.prop = prop;
            this.shouldSerialize = shouldSerialize;
        }
    }

    function objArraySerializer(values: Array<Inner>) {
        return decoratedJson.type(Inner).toPlainArray(
            values.filter(value => value.shouldSerialize),
        );
    }

    @jsonObject()
    class Obj {
        @jsonArrayMember(() => Inner, {serializer: objArraySerializer})
        inners: Array<Inner>;

        @jsonMember()
        str: string;
    }

    beforeAll(function () {
        this.obj = new Obj();
        this.obj.inners = [
            new Inner('valval', false),
            new Inner('something', true),
        ];
        this.obj.str = 'Text';
        this.json = JSON.parse(decoratedJson.type(Obj).stringify(this.obj));
    });

    it('should properly serialize', function () {
        expect(this.json).toEqual(
            {
                inners: [
                    {
                        prop: 'something',
                    },
                ],
                str: 'Text',
            },
        );
    });
});
