import {AnyT, DecoratedJson, jsonArrayMember, jsonMember, jsonObject, jsonSetMember} from '../src';

const decoratedJson = new DecoratedJson();

describe('AnyT', () => {
    describe('on a simple class property', () => {
        @jsonObject()
        class SimplePropertyAny {
            @jsonMember(() => AnyT)
            any: any;

            @jsonMember(() => AnyT)
            anyNullable?: any | null;
        }

        it('should parse from JSON simple object correctly', () => {
            const result = decoratedJson.type(SimplePropertyAny).parse({
                any: {foo: 'bar'},
                anyNullable: {foo: 'bar'},
            });
            expect(result.any).toHaveProperties(['foo']);
            expect(result.anyNullable).toHaveProperties(['foo']);
        });

        it('should parse from JSON class instance correctly', () => {
            const foo = {foo: 'bar'};
            const result = decoratedJson.type(SimplePropertyAny).parse({
                any: foo,
                anyNullable: foo,
            });
            expect(result.any).toEqual(foo);
            expect(result.anyNullable).toEqual(foo);
        });

        it('should perform conversion to JSON with referential equality', () => {
            const foo = {foo: 'bar'};
            const simplePropertyAny = new SimplePropertyAny();
            simplePropertyAny.any = foo;
            simplePropertyAny.anyNullable = foo;
            const result = decoratedJson
                .type(SimplePropertyAny)
                .toPlainJson(simplePropertyAny);
            expect(result.any).toEqual(foo);
            expect(result.anyNullable).toEqual(foo);
        });
    });

    describe('on arrays', () => {
        @jsonObject()
        class ArrayPropertyAny {
            @jsonArrayMember(() => AnyT)
            any: Array<any>;

            @jsonArrayMember(() => AnyT)
            anyNullable?: Array<any> | null;
        }

        const arrayPropertyAnyHandler = decoratedJson.type(ArrayPropertyAny);

        it('should parse from JSON simple object correctly', () => {
            const result = arrayPropertyAnyHandler.parse({
                any: [{foo: 'bar'}],
                anyNullable: [{foo: 'bar'}],
            });
            expect(result.any).toBeInstanceOf(Array);
            expect(result.any[0].foo).toEqual('bar');
            expect(result.anyNullable).toBeInstanceOf(Array);
            expect(result.anyNullable?.[0].foo).toEqual('bar');
        });

        it('should parse from JSON class instance correctly', () => {
            const foo = {foo: 'bar'};
            const result = arrayPropertyAnyHandler.parse({
                any: [foo],
                anyNullable: [foo],
            });
            expect(result.any).toBeInstanceOf(Array);
            expect(result.any[0]).toEqual(foo);
            expect(result.anyNullable).toBeInstanceOf(Array);
            expect(result.anyNullable?.[0]).toEqual(foo);
        });

        it('should perform conversion to JSON with referential equality', () => {
            const foo = {foo: 'bar'};
            const arrayPropertyAny = new ArrayPropertyAny();
            arrayPropertyAny.any = [foo];
            arrayPropertyAny.anyNullable = [foo];
            const result = arrayPropertyAnyHandler.toPlainJson(arrayPropertyAny);
            expect(result.any[0]).toEqual(foo);
            expect(result.anyNullable[0]).toEqual(foo);
        });
    });

    describe('on set', () => {
        @jsonObject()
        class SetPropertyAny {

            @jsonSetMember(() => AnyT)
            any: Set<any>;

            @jsonSetMember(() => AnyT)
            anyNullable?: Set<any> | null;
        }

        it('should parse from JSON simple object correctly', () => {
            const foo = {foo: 'bar'};
            const result = decoratedJson.type(SetPropertyAny).parse({
                any: [foo, foo],
                anyNullable: [foo, foo],
            });
            expect(result.any).toBeInstanceOf(Set);
            expect(result.any.size).toBe(1);
            expect(result.any.values().next().value).toEqual(foo);
            expect(result.anyNullable).toBeInstanceOf(Set);
            expect(result.anyNullable?.size).toBe(1);
            expect(result.anyNullable?.values().next().value).toEqual(foo);
        });

        it('should parse from JSON with referential equality', () => {
            const foo = {foo: 'bar'};
            const result = decoratedJson.type(SetPropertyAny).parse({
                any: [foo, foo],
                anyNullable: [foo, foo],
            });
            expect(result.any).toBeInstanceOf(Set);
            expect(result.any.values().next().value).toBe(foo);
            expect(result.anyNullable).toBeInstanceOf(Set);
            expect(result.anyNullable?.values().next().value).toBe(foo);
        });

        it('should perform conversion to JSON with referential equality', () => {
            const foo = {foo: 'bar'};
            const setPropertyAny = new SetPropertyAny();
            setPropertyAny.any = new Set([foo, foo]);
            setPropertyAny.anyNullable = new Set([foo, foo]);
            const result = decoratedJson.type(SetPropertyAny).toPlainJson(setPropertyAny);
            expect(result.any.values().next().value).toEqual(foo);
            expect(result.anyNullable.values().next().value).toEqual(foo);
        });
    });

    it('should handle complex structures', () => {
        @jsonObject()
        class Event {

            @jsonMember(() => AnyT)
            data?: {[k: string]: any} | null;
        }

        @jsonObject()
        class A {

            @jsonArrayMember(() => Event)
            events: Array<Event>;
        }

        const result = decoratedJson.type(A).parse({
            events: [
                {
                    data: {
                        files: [
                            {
                                name: 'file1',
                            },
                        ],
                    },
                },
            ],
        });

        expect(result.events[0].data?.files[0].name).toEqual('file1');
    });
});
