import {
    DecoratedJson,
    jsonArrayMember,
    jsonMapMember,
    jsonMember,
    jsonObject,
    jsonSetMember,
} from '../../src';
import {MapShape} from '../../src/type-descriptor';
import {A} from './a.model';
import {B} from './b.model';

const decoratedJson = new DecoratedJson();

describe('Lazy types', () => {
    describe('simple member', () => {
        @jsonObject()
        class Root {

            @jsonMember(() => Lazy)
            lazy: Lazy;
        }

        @jsonObject()
        class Lazy {

            @jsonMember()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                lazy: {
                    name: 'hello',
                },
            });

            expect(result.lazy).toBeInstanceOf(Lazy);
            expect(result.lazy.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            root.lazy = new Lazy();
            root.lazy.name = 'hello';
            const result = rootHandler.toPlainJson(root);

            expect(result.lazy.name).toBe('hello');
        });
    });

    describe('array member', () => {
        @jsonObject()
        class Root {

            @jsonArrayMember(() => Lazy)
            lazy: Array<Lazy>;
        }

        @jsonObject()
        class Lazy {

            @jsonMember()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                lazy: [{name: 'hello'}],
            });

            expect(result.lazy.length).toBe(1);
            expect(result.lazy[0]).toBeInstanceOf(Lazy);
            expect(result.lazy[0].name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const lazy = new Lazy();
            lazy.name = 'hello';
            root.lazy = [lazy];
            const result = rootHandler.toPlainJson(root);

            expect(result.lazy.length).toBe(1);
            expect(result.lazy[0].name).toBe('hello');
        });
    });

    describe('map member', () => {
        @jsonObject()
        class Root {

            @jsonMapMember(() => String, () => LazyValue, {shape: MapShape.Array})
            lazy: Map<string, LazyValue>;
        }

        @jsonObject()
        class LazyValue {

            @jsonMember()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                lazy: [{key: 'key', value: {name: 'hello'}}],
            });

            expect(result.lazy.size).toBe(1);
            expect(result.lazy).toBeInstanceOf(Map);
            expect(result.lazy.get('key')).toBeInstanceOf(LazyValue);
            expect(result.lazy.get('key')?.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const lazy = new LazyValue();
            lazy.name = 'hello';
            root.lazy = new Map<string, LazyValue>([['key', lazy]]);
            const result = rootHandler.toPlainJson(root);

            expect(result.lazy.length).toBe(1);
            expect(result.lazy[0].key).toBe('key');
            expect(result.lazy[0].value.name).toBe('hello');
        });
    });

    describe('set member', () => {
        @jsonObject()
        class Root {

            @jsonSetMember(() => Lazy)
            lazy: Set<Lazy>;
        }

        @jsonObject()
        class Lazy {

            @jsonMember()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                lazy: [{name: 'hello'}],
            });

            expect(result.lazy.size).toBe(1);
            expect(result.lazy).toBeInstanceOf(Set);
            expect(result.lazy.values().next().value).toBeInstanceOf(Lazy);
            expect(result.lazy.values().next().value.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const lazy = new Lazy();
            lazy.name = 'hello';
            root.lazy = new Set([lazy]);
            const result = rootHandler.toPlainJson(root);

            expect(result.lazy.length).toBe(1);
            expect(result.lazy[0].name).toBe('hello');
        });
    });

    it('should work on multi file imports', () => {
        const result = decoratedJson.type(A).parse({
            b: {
                a: {
                    b: {
                        name: 'b2',
                    },
                    name: 'a2',
                },
                name: 'b1',
            },
            name: 'a1',
        });

        expect(result).toBeInstanceOf(A);
        expect(result.name).toBe('a1');
        expect(result.test()).toBeTrue();
        expect(result.b).toBeInstanceOf(B);
        expect(result.b.name).toBe('b1');
        expect(result.b.test()).toBeTrue();
        expect(result.b.a).toBeInstanceOf(A);
        expect(result.b.a.name).toBe('a2');
        expect(result.b.a.test()).toBeTrue();
        expect(result.b.a.b).toBeInstanceOf(B);
        expect(result.b.a.b.name).toBe('b2');
        expect(result.b.a.b.test()).toBeTrue();
    });
});
