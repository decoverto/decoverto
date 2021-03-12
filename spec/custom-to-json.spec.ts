import {DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('custom member toJson', () => {
    @jsonObject()
    class Person {
        @jsonMember({toJson: (value: string) => value.split(' ')})
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

    it('should properly convert to JSON', function () {
        expect(this.json).toEqual(
            {
                firstName: ['Mulit', 'term', 'name'],
                lastName: 'Surname',
            },
        );
    });

    it('should not affect parsing', () => {
        expect(decoratedJson.type(Person).parse('{"firstName":"name","lastName":"last"}'))
            .toEqual(Object.assign(new Person(), {firstName: 'name', lastName: 'last'}));
    });
});

describe('custom array member toJson', () => {
    @jsonObject()
    class Obj {
        @jsonArrayMember(() => Number, {toJson: (values: Array<number>) => values.join(',')})
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

    it('should properly convert to JSON', function () {
        expect(this.json).toEqual(
            {
                nums: '3,45,34',
                str: 'Text',
            },
        );
    });

    it('should not affect parsing', () => {
        expect(decoratedJson.type(Obj).parse('{"nums":[4,5,6,7],"str":"string"}'))
            .toEqual(Object.assign(new Obj(), {nums: [4, 5, 6, 7], str: 'string'} as Obj));
    });
});

describe('custom delegating array member toJson', () => {
    @jsonObject()
    class Inner {
        @jsonMember()
        prop: string;

        shouldConvertToJson: boolean;

        constructor();
        constructor(prop: string, shouldConvertToJSon: boolean);
        constructor(prop?: string, shouldConvertToJSon?: boolean) {
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
        @jsonArrayMember(() => Inner, {toJson: objArrayToJson})
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

    it('should properly convert to JSON', function () {
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
