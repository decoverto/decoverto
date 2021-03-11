import {jsonMember, jsonObject, TypedJSON} from '../src';

describe('null', () => {
    describe('should be preserved', () => {
        @jsonObject()
        class Person {
            @jsonMember(() => String)
            name: string | null;
        }

        it('while deserializing', () => {
            const obj = TypedJSON.parse({name: null}, Person);
            expect(obj).toHaveProperties(['name']);
            expect(obj.name).toBe(null);
        });

        it('while serializing', () => {
            const input = new Person();
            input.name = null;
            const json = TypedJSON.toPlainJson(input, Person);
            expect(json).toEqual({name: null});
        });
    });
});

describe('undefined', () => {
    describe('should be not be assigned', () => {
        @jsonObject()
        class Person {
            @jsonMember(() => String)
            name?: string;
        }

        it('while deserializing', () => {
            const obj = TypedJSON.parse({name: undefined}, Person);
            expect(obj).toBeInstanceOf(Person);
            expect(obj).not.toHaveProperties(['name']);
        });

        it('while serializing', () => {
            const input = new Person();
            input.name = undefined;
            const json = TypedJSON.toPlainJson(input, Person);
            expect(json).toEqual({});
        });
    });
});
