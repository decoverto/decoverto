import {DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

describe('null', () => {
    describe('should be preserved', () => {
        @jsonObject()
        class Person {
            @jsonProperty(() => String)
            name: string | null;
        }

        it('while parsing', () => {
            const obj = decoratedJson.type(Person).parse({name: null});
            expect(obj).toHaveProperties(['name']);
            expect(obj.name).toBe(null);
        });

        it('while converting to JSON', () => {
            const input = new Person();
            input.name = null;
            const json = decoratedJson.type(Person).toPlainJson(input);
            expect(json).toEqual({name: null});
        });
    });
});

describe('undefined', () => {
    describe('should be not be assigned', () => {
        @jsonObject()
        class Person {
            @jsonProperty(() => String)
            name?: string;
        }

        it('while parsing', () => {
            const obj = decoratedJson.type(Person).parse({name: undefined});
            expect(obj).toBeInstanceOf(Person);
            expect(obj).not.toHaveProperties(['name']);
        });

        it('while converting to JSON', () => {
            const input = new Person();
            input.name = undefined;
            const json = decoratedJson.type(Person).toPlainJson(input);
            expect(json).toEqual({});
        });
    });
});
