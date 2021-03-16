import {array, DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

describe('custom property toJson', () => {
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

    beforeAll(function (this: {json: any; person: Person}) {
        this.person = new Person();
        this.person.firstName = 'Mulit term name';
        this.person.lastName = 'Surname';
        this.json = JSON.parse(decoratedJson.type(Person).stringify(this.person));
    });

    it('should properly convert to JSON', function (this: {json: any; person: Person}) {
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

describe('custom array property toJson', () => {
    @jsonObject()
    class Obj {
        @jsonProperty(array(() => Number), {toJson: (values: Array<number>) => values.join(',')})
        nums: Array<number>;

        @jsonProperty()
        str: string;

        sum() {
            return this.nums.reduce((sum, cur) => sum + cur, 0);
        }
    }

    beforeAll(function (this: {json: any; obj: Obj}) {
        this.obj = new Obj();
        this.obj.nums = [3, 45, 34];
        this.obj.str = 'Text';
        this.json = JSON.parse(decoratedJson.type(Obj).stringify(this.obj));
    });

    it('should properly convert to JSON', function (this: {json: any; obj: Obj}) {
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

describe('custom delegating array property toJson', () => {
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

    beforeAll(function (this: {json: any; obj: Obj}) {
        this.obj = new Obj();
        this.obj.inners = [
            new Inner('valval', false),
            new Inner('something', true),
        ];
        this.obj.str = 'Text';
        this.json = JSON.parse(decoratedJson.type(Obj).stringify(this.obj));
    });

    it('should properly convert to JSON', function (this: {json: any; obj: Obj}) {
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
