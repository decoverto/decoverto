import {ArrayT, DecoratedJson, jsonMapMember, jsonMember, jsonObject} from '../src';
import {MapShape} from '../src/type-descriptor';

const decoratedJson = new DecoratedJson();

describe('map', () => {
    describe('with dictionary shape', () => {
        @jsonObject()
        class Simple {
            @jsonMember()
            strProp: string;

            @jsonMember()
            numProp: number;

            constructor(init?: {strProp: string; numProp: number}) {
                if (init !== undefined) {
                    this.strProp = init.strProp;
                    this.numProp = init.numProp;
                }
            }

            foo() {
                return `${this.strProp}-${this.numProp}`;
            }
        }

        @jsonObject()
        class DictMap {
            @jsonMapMember(() => String, () => Simple, {shape: MapShape.OBJECT})
            prop: Map<string, Simple>;

            getSetSize() {
                return this.prop.size;
            }
        }

        it('parses', () => {
            const result = decoratedJson.type(DictMap).parse(
                JSON.stringify(
                    {
                        prop: {
                            one: {strProp: 'delta', numProp: 4},
                            two: {strProp: 'gamma', numProp: 7},
                        },
                    },
                ),
            );

            expect(result).toBeInstanceOf(DictMap);
            expect(result.prop).toBeDefined();
            expect(result.prop).toBeInstanceOf(Map);
            expect(result.prop.size).toBe(2);
            expect(result.getSetSize()).toBe(2);
            expect(result.prop.get('one')?.strProp).toBe('delta');
            expect(result.prop.get('two')?.strProp).toBe('gamma');
        });

        it('stringifies', () => {
            const object = new DictMap();
            object.prop = new Map<string, Simple>([
                ['one', new Simple({strProp: 'delta', numProp: 4})],
                ['two', new Simple({strProp: 'gamma', numProp: 7})],
            ]);
            const result = decoratedJson.type(DictMap).stringify(object);

            expect(result).toBe(JSON.stringify({
                prop: {
                    one: {strProp: 'delta', numProp: 4},
                    two: {strProp: 'gamma', numProp: 7},
                },
            }));
        });
    });

    describe('with array shape', () => {
        @jsonObject()
        class Simple {
            @jsonMember()
            foo: string;

            constructor(foo?: string) {
                if (foo !== undefined) {
                    this.foo = foo;
                }
            }
        }

        @jsonObject()
        class DictionaryArrayShape {
            @jsonMapMember(() => String, () => Simple, {shape: MapShape.ARRAY})
            map: Map<string, Simple>;
        }

        const typeHandler = decoratedJson.type(DictionaryArrayShape);

        it('should parse', () => {
            const result = typeHandler.parse({
                map: [
                    {key: 'one', value: {foo: 'value1'}},
                ],
            });

            expect(result.map).toBeInstanceOf(Map);
            expect(result.map.get('one')?.foo).toBe('value1');
        });

        it('should convert to JSON', () => {
            const object = new DictionaryArrayShape();
            object.map = new Map<string, Simple>([
                ['one', new Simple('foo')],
            ]);
            const result = typeHandler.toPlainJson(object);
            expect(result.map).toBeInstanceOf(Array);
            expect(result.map[0].key).toBe('one');
            expect(result.map[0].value.foo).toBe('foo');
        });
    });

    describe('with an array as value', () => {
        @jsonObject()
        class Simple {
            @jsonMember()
            strProp: string;

            @jsonMember()
            numProp: number;

            constructor(init?: {strProp: string; numProp: number}) {
                if (init !== undefined) {
                    this.strProp = init.strProp;
                    this.numProp = init.numProp;
                }
            }

            foo() {
                return `${this.strProp}-${this.numProp}`;
            }
        }

        @jsonObject()
        class DictArrayMap {
            @jsonMapMember(() => String, () => ArrayT(Simple), {shape: MapShape.OBJECT})
            prop: Map<string, Array<Simple>>;

            getSetSize() {
                return this.prop.size;
            }
        }

        it('parses', () => {
            const result = decoratedJson.type(DictArrayMap).parse(
                JSON.stringify(
                    {
                        prop: {
                            one: [{strProp: 'delta', numProp: 4}],
                            two: [{strProp: 'gamma', numProp: 7}, {strProp: 'alpha', numProp: 2}],
                        },
                    },
                ),
            );

            expect(result).toBeInstanceOf(DictArrayMap);
            expect(result.prop).toBeDefined();
            expect(result.prop).toBeInstanceOf(Map);
            expect(result.prop.size).toBe(2);
            expect(result.getSetSize()).toBe(2);
            expect(result.prop.get('one')?.length).toBe(1);
            expect(result.prop.get('one')?.[0].foo()).toBe('delta-4');
            expect(result.prop.get('two')?.length).toBe(2);
            expect(result.prop.get('two')?.[0].foo()).toBe('gamma-7');
            expect(result.prop.get('two')?.[1].foo()).toBe('alpha-2');
        });

        it('stringifies', () => {
            const object = new DictArrayMap();
            object.prop = new Map<string, Array<Simple>>([
                ['one', [new Simple({strProp: 'delta', numProp: 4})]],
                ['two', [
                    new Simple({strProp: 'gamma', numProp: 7}),
                    new Simple({strProp: 'alpha', numProp: 2}),
                ]],
            ]);
            const result = decoratedJson.type(DictArrayMap).stringify(object);

            expect(result).toBe(JSON.stringify({
                prop: {
                    one: [{strProp: 'delta', numProp: 4}],
                    two: [{strProp: 'gamma', numProp: 7}, {strProp: 'alpha', numProp: 2}],
                },
            }));
        });
    });
});
