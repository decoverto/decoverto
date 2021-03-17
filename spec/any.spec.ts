import {Any, array, DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

describe('Any', () => {
    describe('on a simple class property', () => {
        @jsonObject()
        class SimplePropertyAny {
            @jsonProperty(Any)
            any: any;

            @jsonProperty(Any)
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

    it('should handle complex structures', () => {
        @jsonObject()
        class Event {

            @jsonProperty(Any)
            data?: {[k: string]: any} | null;
        }

        @jsonObject()
        class A {

            @jsonProperty(array(() => Event))
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
