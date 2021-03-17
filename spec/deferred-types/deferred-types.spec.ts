import {
    array,
    DecoratedJson,
    jsonObject,
    jsonProperty,
    map,
    MapShape,
    set,
} from '../../src';
import {A} from './a.model';
import {B} from './b.model';

const decoratedJson = new DecoratedJson();

describe('Deferred types', () => {
    describe('simple property', () => {
        @jsonObject()
        class Root {

            @jsonProperty(() => Deferred)
            deferred: Deferred;
        }

        @jsonObject()
        class Deferred {

            @jsonProperty()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                deferred: {
                    name: 'hello',
                },
            });

            expect(result.deferred).toBeInstanceOf(Deferred);
            expect(result.deferred.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            root.deferred = new Deferred();
            root.deferred.name = 'hello';
            const result = rootHandler.toPlainJson(root);

            expect(result.deferred.name).toBe('hello');
        });
    });

    describe('array property', () => {
        @jsonObject()
        class Root {

            @jsonProperty(array(() => Deferred))
            deferred: Array<Deferred>;
        }

        @jsonObject()
        class Deferred {

            @jsonProperty()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                deferred: [{name: 'hello'}],
            });

            expect(result.deferred.length).toBe(1);
            expect(result.deferred[0]).toBeInstanceOf(Deferred);
            expect(result.deferred[0].name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const deferred = new Deferred();
            deferred.name = 'hello';
            root.deferred = [deferred];
            const result = rootHandler.toPlainJson(root);

            expect(result.deferred.length).toBe(1);
            expect(result.deferred[0].name).toBe('hello');
        });
    });

    describe('map property', () => {
        @jsonObject()
        class Root {

            @jsonProperty(map(() => String, () => DeferredValue, {shape: MapShape.Array}))
            deferred: Map<string, DeferredValue>;
        }

        @jsonObject()
        class DeferredValue {

            @jsonProperty()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                deferred: [{key: 'key', value: {name: 'hello'}}],
            });

            expect(result.deferred.size).toBe(1);
            expect(result.deferred).toBeInstanceOf(Map);
            expect(result.deferred.get('key')).toBeInstanceOf(DeferredValue);
            expect(result.deferred.get('key')?.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const deferred = new DeferredValue();
            deferred.name = 'hello';
            root.deferred = new Map<string, DeferredValue>([['key', deferred]]);
            const result = rootHandler.toPlainJson(root);

            expect(result.deferred.length).toBe(1);
            expect(result.deferred[0].key).toBe('key');
            expect(result.deferred[0].value.name).toBe('hello');
        });
    });

    describe('set property', () => {
        @jsonObject()
        class Root {

            @jsonProperty(set(() => Deferred))
            deferred: Set<Deferred>;
        }

        @jsonObject()
        class Deferred {

            @jsonProperty()
            name: string;
        }

        const rootHandler = decoratedJson.type(Root);

        it('should parse from JSON', () => {
            const result = rootHandler.parse({
                deferred: [{name: 'hello'}],
            });

            expect(result.deferred.size).toBe(1);
            expect(result.deferred).toBeInstanceOf(Set);
            expect(result.deferred.values().next().value).toBeInstanceOf(Deferred);
            expect(result.deferred.values().next().value.name).toBe('hello');
        });

        it('should perform conversion to JSON', () => {
            const root = new Root();
            const deferred = new Deferred();
            deferred.name = 'hello';
            root.deferred = new Set([deferred]);
            const result = rootHandler.toPlainJson(root);

            expect(result.deferred.length).toBe(1);
            expect(result.deferred[0].name).toBe('hello');
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
