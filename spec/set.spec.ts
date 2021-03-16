import {Any, array, DecoratedJson, jsonObject, jsonProperty, set} from '../src';
import {Everything} from './utils/everything';

const decoratedJson = new DecoratedJson();

describe('set of objects', () => {
    @jsonObject()
    class Simple {
        @jsonProperty()
        strProp: string;

        @jsonProperty()
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

    it('parses an empty set', () => {
        const result = decoratedJson.type(Simple).parseSet('[]');
        expect(result).toBeDefined();
        expect(result.size).toBe(0);
    });

    it('stringifies an empty set', () => {
        const result = decoratedJson.type(Simple).stringifySet(new Set<Simple>());
        expect(result).toBe('[]');
    });

    it('parsed should be of proper type', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const result = decoratedJson.type(Simple).parseSet(JSON.stringify(expectation));

        expect(result.size).toBe(3, 'Parsed set is of wrong size');
        result.forEach(obj => {
            expect(obj).toBeInstanceOf(Simple);
            expect(expectation.find(expected => expected.strProp === obj.strProp)).toBeDefined();
        });
    });

    it('stringified should contain all elements', () => {
        const expectation = [
            {strProp: 'delta', numProp: 4},
            {strProp: 'bravo', numProp: 2},
            {strProp: 'gamma', numProp: 0},
        ];

        const input = new Set<Simple>(expectation.map(obj => new Simple(obj)));
        const result = decoratedJson.type(Simple).stringifySet(input);

        expect(result).toBe(JSON.stringify(expectation));
    });

    describe('should error', () => {
        it('on non-array fromJson', () => {
            expect(() => decoratedJson.type(Simple).parseSet(false as any))
                .toThrowError('Got invalid value. Received Boolean, expected Array<Simple>.');
        });

        it('on non-set toJson', () => {
            expect(() => decoratedJson.type(Simple).toPlainSet([] as any))
                .toThrowError('Got invalid value. Received Array, expected Set<Simple>.');
        });
    });
});

describe('set property', () => {
    @jsonObject()
    class WithSet {
        @jsonProperty(set(() => Everything))
        prop: Set<Everything>;

        getSetSize() {
            return this.prop.size;
        }
    }

    it('parses', () => {
        const object = {prop: [Everything.create(), Everything.create()]};
        const result = decoratedJson.type(WithSet).parse(JSON.stringify(object));

        expect(result).toBeInstanceOf(WithSet);
        expect(result.prop).toBeDefined();
        expect(result.prop).toBeInstanceOf(Set);
        expect(result.prop.size).toBe(2);
        expect(result.getSetSize()).toBe(2);
        expect(Array.from(result.prop)).toEqual([Everything.expected(), Everything.expected()]);
    });

    it('stringifies', () => {
        const object = new WithSet();
        object.prop = new Set<Everything>([Everything.expected(), Everything.expected()]);
        const result = decoratedJson.type(WithSet).stringify(object);

        expect(result).toBe(JSON.stringify({prop: [Everything.create(), Everything.create()]}));
    });
});

describe('set array property', () => {
    @jsonObject()
    class Simple {
        @jsonProperty()
        strProp: string;

        @jsonProperty()
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
    class WithSet {
        @jsonProperty(set(array(() => Simple)))
        prop: Set<Array<Simple>>;

        getSetSize() {
            return this.prop.size;
        }
    }

    it('parses', () => {
        const result = decoratedJson.type(WithSet).parse(
            JSON.stringify(
                {
                    prop: [
                        [
                            {strProp: 'delta', numProp: 4},
                            {strProp: 'bravo', numProp: 2},
                            {strProp: 'gamma', numProp: 0},
                        ],
                        [
                            {strProp: 'alpha', numProp: 3245},
                            {strProp: 'zeta', numProp: 4358},
                        ],
                    ],
                },
            ),
        );

        expect(result).toBeInstanceOf(WithSet);
        expect(result.prop).toBeDefined();
        expect(result.prop).toBeInstanceOf(Set);
        expect(result.prop.size).toBe(2);
        expect(result.getSetSize()).toBe(2);
        expect(Array.from(result.prop)).toEqual([
            [
                new Simple({strProp: 'delta', numProp: 4}),
                new Simple({strProp: 'bravo', numProp: 2}),
                new Simple({strProp: 'gamma', numProp: 0}),
            ],
            [
                new Simple({strProp: 'alpha', numProp: 3245}),
                new Simple({strProp: 'zeta', numProp: 4358}),
            ],
        ]);
    });

    it('stringifies', () => {
        const object = new WithSet();
        object.prop = new Set<Array<Simple>>([
            [new Simple({strProp: 'delta', numProp: 4})],
            [
                new Simple({strProp: 'alpha', numProp: 3245}),
                new Simple({strProp: 'zeta', numProp: 4358}),
            ],
        ]);
        const result = decoratedJson.type(WithSet).stringify(object);

        expect(result).toBe(JSON.stringify({
            prop: [
                [
                    {
                        strProp: 'delta',
                        numProp: 4,
                    },
                ],
                [
                    {
                        strProp: 'alpha',
                        numProp: 3245,
                    },
                    {
                        strProp: 'zeta',
                        numProp: 4358,
                    },
                ],
            ],
        }));
    });
});

describe('set of raw objects', () => {
    @jsonObject()
    class WithRawSet {
        @jsonProperty(set(Any))
        rawSet: Set<any>;
    }

    function rawObjects() {
        return [
            {
                prop: 'something',
            },
            {
                another: 'value',
            },
        ];
    }

    it('should parse from JSON as is', () => {
        const withRawSet = decoratedJson.type(WithRawSet).parse({rawSet: rawObjects()});
        expect(withRawSet).toBeDefined();
        expect(withRawSet instanceof WithRawSet).toBeTruthy();
        expect(withRawSet.rawSet).toEqual(new Set(rawObjects()));
    });

    it('should perform conversion to JSON as is', () => {
        const withRawSet = new WithRawSet();
        withRawSet.rawSet = new Set(rawObjects());
        const json = decoratedJson.type(WithRawSet).toPlainJson(withRawSet);
        expect(json).toEqual({rawSet: rawObjects()});
    });
});
