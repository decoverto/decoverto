import {DecoratedJson, JsonHandlerSimple, jsonObject, jsonProperty} from '../src';

describe('JSON handler', () => {
    @jsonObject()
    class JsonHandlerTest {

        @jsonProperty()
        foo: 'unchanged' | 'changed';

        constructor(foo: 'unchanged' | 'changed') {
            this.foo = foo;
        }
    }

    describe('Simple', () => {
        it('should use replacer', () => {
            const decoratedJson = new DecoratedJson({
                jsonHandler: new JsonHandlerSimple({
                    replacer: (key, value) => {
                        if (value === 'unchanged') {
                            return 'changed';
                        }

                        return value;
                    },
                }),
            });

            const typeHandler = decoratedJson.type(JsonHandlerTest);
            const plain = JSON.parse(typeHandler.stringify(new JsonHandlerTest('unchanged')));
            expect(plain.foo).toBe('changed');
        });

        it('should use reviver', () => {
            const decoratedJson = new DecoratedJson({
                jsonHandler: new JsonHandlerSimple({
                    reviver: (key, value) => {
                        if (value === 'unchanged') {
                            return 'changed';
                        }

                        return value;
                    },
                }),
            });
            const typeHandler = decoratedJson.type(JsonHandlerTest);
            const parsed = typeHandler.parse(JSON.stringify({foo: 'unchanged'}));
            expect(parsed.foo).toBe('changed');
        });

        it('should use correct indentation', () => {
            const decoratedJson = new DecoratedJson({
                jsonHandler: new JsonHandlerSimple({
                    spaces: 4,
                }),
            });
            const typeHandler = decoratedJson.type(JsonHandlerTest);
            const stringified = typeHandler.stringify(new JsonHandlerTest('unchanged'));
            expect(stringified).toContain('   "foo"');
        });
    });

    describe('Custom', () => {
        const decoratedJson = new DecoratedJson({
            jsonHandler: {
                parse: () => new JsonHandlerTest('changed'),
                stringify: () => '{"foo": "changed"}',
            },
        });
        const typeHandler = decoratedJson.type(JsonHandlerTest);

        it('should use the custom parse function', () => {
            expect(typeHandler.parse(JSON.stringify({
                foo: 'unchanged',
            })).foo).toBe('changed');
        });

        it('should use the custom stringify function', () => {
            expect(typeHandler.stringify(new JsonHandlerTest('unchanged')))
                .toBe('{"foo": "changed"}');
        });
    });
});
