import {DecoratedJson, jsonObject, jsonProperty} from '../src';

const decoratedJson = new DecoratedJson();

describe('afterFromJson', () => {
    it('should call the static method', () => {
        @jsonObject({
            afterFromJson: 'afterDeser',
        })
        class Person {
            @jsonProperty()
            name: string;

            @jsonProperty()
            age: number;

            static afterDeser() {
                // should call
            }

            getDescription() {
                return `${this.name} is ${this.age}y old`;
            }
        }

        spyOn(Person, 'afterDeser');

        const person = decoratedJson.type(Person).parse({name: 'John', age: 20})!;
        expect(person instanceof Person).toBeTruthy();
        expect(person.getDescription()).toEqual('John is 20y old');
        expect(Person.afterDeser).toHaveBeenCalled();
    });

    it('should call the instance method', () => {
        @jsonObject({
            afterFromJson: 'afterDeser',
        })
        class Person {
            @jsonProperty()
            name: string;

            @jsonProperty()
            age: number;

            constructor() {
                spyOn<Person, 'afterDeser'>(this, 'afterDeser');
            }

            afterDeser() {
                // should call
            }

            getDescription() {
                return `${this.name} is ${this.age}y old`;
            }
        }

        const person = decoratedJson.type(Person).parse({name: 'John', age: 20})!;
        expect(person instanceof Person).toBeTruthy();
        expect(person.getDescription()).toEqual('John is 20y old');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(person.afterDeser).toHaveBeenCalled();
    });

    it('should prefer the instance method over the static method', () => {
        @jsonObject({
            afterFromJson: 'afterDeser',
        })
        class Person {
            @jsonProperty()
            name: string;

            @jsonProperty()
            age: number;

            constructor() {
                spyOn<Person, 'afterDeser'>(this, 'afterDeser');
            }

            static afterDeser() {
                // should NOT call
            }

            afterDeser() {
                // should call
            }

            getDescription() {
                return `${this.name} is ${this.age}y old`;
            }
        }

        spyOn(Person, 'afterDeser');

        const person = decoratedJson.type(Person).parse({name: 'John', age: 20})!;
        expect(person instanceof Person).toBeTruthy();
        expect(person.getDescription()).toEqual('John is 20y old');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(person.afterDeser).toHaveBeenCalled();
        expect(Person.afterDeser).not.toHaveBeenCalled();
    });
});
