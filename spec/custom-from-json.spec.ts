import {array, DecoratedJson, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('custom member fromJson', () => {
    @jsonObject()
    class Person {
        @jsonMember({fromJson: (json: any) => json[0]})
        firstName: string;

        @jsonMember()
        lastName: string;

        getFullName() {
            return `${this.firstName} ${this.lastName}`;
        }
    }

    beforeAll(function (this: {person: Person}) {
        this.person = decoratedJson.type(Person)
            .parse('{ "firstName": ["John"], "lastName": "Doe" }');
    });

    it('should properly parse', function (this: {person: Person}) {
        expect(this.person.firstName).toBe('John');
        expect(this.person.lastName).toBe('Doe');
    });

    it('should return object of proper type', function (this: {person: Person}) {
        expect(this.person instanceof Person).toBeTruthy();
    });

    it('should return object with callable functions', function (this: {person: Person}) {
        expect(this.person.getFullName?.()).toBe('John Doe');
    });

    it('should not affect toJson', function (this: {person: Person}) {
        expect(decoratedJson.type(Person).stringify(this.person))
            .toBe('{"firstName":"John","lastName":"Doe"}');
    });
});

describe('custom array member fromJson', () => {
    @jsonObject()
    class Obj {
        @jsonMember(array(() => Number), {
            fromJson: (json: string) => json.split(',').map((v) => parseInt(v, 10)),
        })
        nums: Array<number>;

        @jsonMember()
        str: string;

        sum() {
            return this.nums.reduce((sum, cur) => sum + cur, 0);
        }
    }

    beforeAll(function (this: {obj: Obj}) {
        this.obj = decoratedJson.type(Obj).parse('{ "nums": "1,2,3,4,5", "str": "Some string" }');
    });

    it('should properly parse', function (this: {obj: Obj}) {
        expect(this.obj.nums).toEqual([1, 2, 3, 4, 5]);
        expect(this.obj.str).toBe('Some string');
    });

    it('should obj object of proper type', function (this: {obj: Obj}) {
        expect(this.obj instanceof Obj).toBeTruthy();
    });

    it('should return object with callable functions', function (this: {obj: Obj}) {
        expect(this.obj.sum?.()).toBe(15);
    });

    it('should not affect toJson', function (this: {obj: Obj}) {
        expect(decoratedJson.type(Obj).stringify(this.obj))
            .toBe('{"nums":[1,2,3,4,5],"str":"Some string"}');
    });
});

describe('custom delegating array member toJson', () => {
    @jsonObject()
    class Inner {
        @jsonMember()
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
        @jsonMember(array(() => Inner), {fromJson: objArrayFromJson})
        inners: Array<Inner>;

        @jsonMember()
        str: string;
    }

    beforeAll(function (this: {obj: Obj}) {
        this.obj = decoratedJson.type(Obj).parse(
            JSON.stringify({
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
            }),
        );
    });

    it('should properly convert to JSON', function (this: {obj: Obj}) {
        expect(this.obj).toBeDefined();
        expect(this.obj instanceof Obj).toBeTruthy();
        expect(this.obj.str).toEqual('Text');
        expect(this.obj.inners.length).toEqual(1);
        expect(this.obj.inners[0] instanceof Inner).toBeTruthy();
        expect(this.obj.inners[0]).not.toHaveProperties(['shouldConvertToObject'] as any);
        expect(this.obj.inners[0]).toHaveProperties({prop: 'gogo'});
        expect(this.obj.inners[0].woo()).toEqual('hoo');
    });
});
