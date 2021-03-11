import {DecoratedJson, jsonArrayMember, jsonMember, jsonObject} from '../src';
import {Everything} from './utils/everything';

const decoratedJson = new DecoratedJson();

describe('basic serialization of', () => {
    describe('builtins', () => {
        it('should deserialize', () => {
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

        it('should serialize', () => {
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
            @jsonMember()
            firstName: string;

            @jsonMember()
            lastName: string;

            getFullName() {
                return `${this.firstName} ${this.lastName}`;
            }
        }

        describe('deserialized', () => {
            beforeAll(function () {
                this.person = decoratedJson
                    .type(Person)
                    .parse('{ "firstName": "John", "lastName": "Doe" }');
            });

            it('should be of proper type', function () {
                expect(this.person instanceof Person).toBeTruthy();
            });

            it('should have functions', function () {
                expect(this.person.getFullName).toBeDefined();
                expect(this.person.getFullName()).toBe('John Doe');
            });
        });

        describe('serialized', () => {
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
        it('should deserialized', () => {
            const everything = Everything.create();

            const deserialized = decoratedJson.type(Everything).parse(JSON.stringify(everything));

            expect(deserialized).toEqual(Everything.expected());
        });

        it('should serialize', () => {
            const everything = Everything.create();

            const serialized = decoratedJson.type(Everything).stringify(new Everything(everything));

            expect(serialized).toBe(JSON.stringify(everything));
        });
    });

    describe('class with defaults', () => {
        describe('by assigment', () => {
            @jsonObject()
            class WithDefaults {
                @jsonMember()
                num: number = 2;

                @jsonMember()
                str: string = 'Hello world';

                @jsonMember()
                bool: boolean = true;

                @jsonArrayMember(() => String)
                arr: Array<string> = [];

                @jsonMember()
                present: number = 10;
            }

            it('should use defaults when missing', () => {
                const deserialized = decoratedJson.type(WithDefaults).parse('{"present":5}');
                const expected = new WithDefaults();
                expected.present = 5;
                expect(deserialized).toEqual(expected);
            });
        });

        describe('by constructor', () => {
            @jsonObject()
            class WithCtr {
                @jsonMember()
                num: number;

                @jsonMember()
                str: string;

                @jsonMember()
                bool: boolean;

                @jsonArrayMember(() => String)
                arr: Array<string>;

                @jsonMember()
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
                const deserialized = decoratedJson.type(WithCtr).parse('{"present":5}');
                const expected = new WithCtr();
                expected.present = 5;
                expect(deserialized).toEqual(expected);
            });
        });
    });

    describe('getters/setters', () => {
        @jsonObject()
        class SomeClass {
            private _prop: string = 'value';
            @jsonMember()
            get prop(): string {
                return this._prop;
            }

            set prop(val: string) {
                this._prop = val;
            }

            private _getterOnly: string = 'getter';
            @jsonMember()
            get getterOnly(): string {
                return this._getterOnly;
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            private _setterOnly: string = 'setter';
            @jsonMember()
            set setterOnly(val: string) {
                this._setterOnly = val;
            }
        }

        it('should serialize', () => {
            const serialized = decoratedJson.type(SomeClass).stringify(new SomeClass());
            expect(serialized).toBe('{"prop":"value","getterOnly":"getter"}');
        });

        it('should deserialize', () => {
            const deserialized = decoratedJson.type(SomeClass).parse(
                '{"prop":"other value","setterOnly":"ok"}',
            );

            const expected = new SomeClass();
            expected.prop = 'other value';
            expected.setterOnly = 'ok';
            expect(deserialized).toEqual(expected);
        });

        it('should deserialize ignoring readonly properties', () => {
            pending('this is not supported as of now');
            const deserialized = decoratedJson.type(SomeClass).parse(
                '{"prop":"other value","getterOnly":"ignored","setterOnly":"ok"}',
            );

            const expected = new SomeClass();
            expected.prop = 'other value';
            expected.setterOnly = 'ok';
            expect(deserialized).toEqual(expected);
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

        it('should throw when using passing base for serialization/deserialization', () => {
            expect(() => decoratedJson.type(JustForOrganizationalPurpose).stringify(new Child()))
                .toThrow();
            expect(() => decoratedJson.type(JustForOrganizationalPurpose).parse('{}')).toThrow();
        });
    });
});
