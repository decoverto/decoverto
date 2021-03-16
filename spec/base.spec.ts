import {array, DecoratedJson, jsonObject, jsonProperty} from '../src';
import {Everything} from './utils/everything';

const decoratedJson = new DecoratedJson();

describe('basic conversion of', () => {
    describe('builtins', () => {
        it('should parse from JSON', () => {
            expect(decoratedJson.type(String).parse('"str"')).toEqual('str');
            expect(decoratedJson.type(Number).parse('45834')).toEqual(45834);
            expect(decoratedJson.type(Boolean).parse('true')).toEqual(true);
            expect(decoratedJson.type(Date).parse('1543915254')).toEqual(new Date(1543915254));
            expect(decoratedJson.type(Date).parse('-1543915254')).toEqual(new Date(-1543915254));
            expect(decoratedJson.type(Date).parse('"1970-01-18T20:51:55.254Z"'))
                .toEqual(new Date(1543915254));

            const dataBuffer = Uint8Array.from([100, 117, 112, 97]) as any;
            expect(decoratedJson.type(ArrayBuffer).parse('"畤慰"')).toEqual(dataBuffer);
            expect(decoratedJson.type(DataView).parse('"畤慰"')).toEqual(dataBuffer);
            expect(decoratedJson.type(Uint8Array).parse('[100,117,112,97]')).toEqual(dataBuffer);
        });

        it('should perform conversion to JSON', () => {
            expect(decoratedJson.type(String).stringify('str')).toEqual('"str"');
            expect(decoratedJson.type(Number).stringify(45834)).toEqual('45834');
            expect(decoratedJson.type(Boolean).stringify(true)).toEqual('true');
            expect(decoratedJson.type(Date).stringify(new Date(1543915254)))
                .toEqual(`"${new Date(1543915254).toISOString()}"`);
            expect(decoratedJson.type(Date).stringify(new Date(-1543915254)))
                .toEqual(`"${new Date(-1543915254).toISOString()}"`);
            expect(decoratedJson.type(Date).stringify(new Date('2018-12-04T09:20:54')))
                .toEqual(`"${new Date('2018-12-04T09:20:54').toISOString()}"`);

            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            view.setInt8(0, 100);
            view.setInt8(1, 117);
            view.setInt8(2, 112);
            view.setInt8(3, 97);
            expect(decoratedJson.type(ArrayBuffer).stringify(buffer)).toEqual('"畤慰"');
            expect(decoratedJson.type(DataView).stringify(view)).toEqual('"畤慰"');
            expect(decoratedJson.type(Uint8Array).stringify(new Uint8Array(buffer)))
                .toEqual('[100,117,112,97]');
        });
    });

    describe('single class', () => {
        @jsonObject()
        class Person {
            @jsonProperty()
            firstName: string;

            @jsonProperty()
            lastName: string;

            getFullName() {
                return `${this.firstName} ${this.lastName}`;
            }
        }

        describe('parsed', () => {
            beforeAll(function (this: {person: Person}) {
                this.person = decoratedJson
                    .type(Person)
                    .parse('{ "firstName": "John", "lastName": "Doe" }');
            });

            it('should be of proper type', function (this: {person: Person}) {
                expect(this.person instanceof Person).toBeTruthy();
            });

            it('should have functions', function (this: {person: Person}) {
                expect(this.person.getFullName.bind(this.person)).toBeDefined();
                expect(this.person.getFullName()).toBe('John Doe');
            });
        });

        describe('converted to JSON', () => {
            it('should contain all data', () => {
                const person = new Person();
                person.firstName = 'John';
                person.lastName = 'Doe';
                expect(decoratedJson.type(Person).stringify(person))
                    .toBe('{"firstName":"John","lastName":"Doe"}');
            });
        });
    });

    describe('all types', () => {
        it('should parse from JSON', () => {
            const everything = Everything.create();

            const object = decoratedJson.type(Everything).parse(JSON.stringify(everything));

            expect(object).toEqual(Everything.expected());
        });

        it('should perform conversion to JSON', () => {
            const everything = Everything.create();

            const json = decoratedJson.type(Everything).stringify(new Everything(everything));

            expect(json).toBe(JSON.stringify(everything));
        });
    });

    describe('class with defaults', () => {
        describe('by assigment', () => {
            @jsonObject()
            class WithDefaults {
                @jsonProperty()
                num: number = 2;

                @jsonProperty()
                str: string = 'Hello world';

                @jsonProperty()
                bool: boolean = true;

                @jsonProperty(array(() => String))
                arr: Array<string> = [];

                @jsonProperty()
                present: number = 10;
            }

            it('should use defaults when missing', () => {
                const parsed = decoratedJson.type(WithDefaults).parse('{"present":5}');
                const expected = new WithDefaults();
                expected.present = 5;
                expect(parsed).toEqual(expected);
            });
        });

        describe('by constructor', () => {
            @jsonObject()
            class WithCtr {
                @jsonProperty()
                num: number;

                @jsonProperty()
                str: string;

                @jsonProperty()
                bool: boolean;

                @jsonProperty(array(() => String))
                arr: Array<string>;

                @jsonProperty()
                present: number;

                constructor() {
                    this.num = 2;
                    this.str = 'Hello world';
                    this.bool = true;
                    this.arr = [];
                    this.present = 10;
                }
            }

            it('should use defaults when missing', () => {
                const parsed = decoratedJson.type(WithCtr).parse('{"present":5}');
                const expected = new WithCtr();
                expected.present = 5;
                expect(parsed).toEqual(expected);
            });
        });
    });

    describe('getters/setters', () => {
        @jsonObject()
        class SomeClass {
            private _prop: string = 'value';
            @jsonProperty()
            get prop(): string {
                return this._prop;
            }

            set prop(val: string) {
                this._prop = val;
            }

            private _getterOnly: string = 'getter';
            @jsonProperty()
            get getterOnly(): string {
                return this._getterOnly;
            }

            private _setterOnly: string = 'setter';
            @jsonProperty()
            set setterOnly(val: string) {
                this._setterOnly = val;
            }

            /**
             * Exists to prevent a "'_setterOnly' is declared but its value is never read." error.
             */
            noTsIgnore(): string {
                return this._setterOnly;
            }
        }

        it('should perform conversion to JSON', () => {
            const json = decoratedJson.type(SomeClass).stringify(new SomeClass());
            expect(json).toBe('{"prop":"value","getterOnly":"getter"}');
        });

        it('should parse from JSON', () => {
            const parsed = decoratedJson.type(SomeClass).parse(
                '{"prop":"other value","setterOnly":"ok"}',
            );

            const expected = new SomeClass();
            expected.prop = 'other value';
            expected.setterOnly = 'ok';
            expect(parsed).toEqual(expected);
        });

        it('should parse from JSON ignoring readonly properties', () => {
            pending('this is not supported as of now');
            const parsed = decoratedJson.type(SomeClass).parse(
                '{"prop":"other value","getterOnly":"ignored","setterOnly":"ok"}',
            );

            const expected = new SomeClass();
            expected.prop = 'other value';
            expected.setterOnly = 'ok';
            expect(parsed).toEqual(expected);
        });
    });

    describe('structural inheritance', () => {
        class JustForOrganizationalPurpose {

        }

        @jsonObject()
        class Child extends JustForOrganizationalPurpose {

        }

        it('should work for unannotated base class', () => {
            expect(decoratedJson.type(Child).stringify(new Child())).toEqual('{}');
            expect(decoratedJson.type(Child).parse('{}')).toEqual(new Child());
        });

        it('should throw when using passing base for conversion', () => {
            expect(() => decoratedJson.type(JustForOrganizationalPurpose).stringify(new Child()))
                .toThrow();
            expect(() => decoratedJson.type(JustForOrganizationalPurpose).parse('{}')).toThrow();
        });
    });
});
