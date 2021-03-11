import {DecoratedJson, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('beforeSerialization', () => {
    it('should call the static method', () => {
        @jsonObject({
            beforeSerialization: 'beforeSerial',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            static beforeSerial() {
                // to have been called
            }
        }

        spyOn(Person, 'beforeSerial');

        const youngPerson = decoratedJson.type(Person).parse({age: 10});
        expect(youngPerson instanceof Person).toBeTruthy();
        expect(youngPerson.isOld).toBeUndefined();
        decoratedJson.type(Person).stringify(youngPerson);

        expect(Person.beforeSerial).toHaveBeenCalled();
    });

    it('should call the member method', () => {
        @jsonObject({
            beforeSerialization: 'beforeSerial',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            beforeSerial() {
                if (this.age < 20) {
                    this.isOld = false;
                } else {
                    this.isOld = true;
                }
            }
        }

        const youngPerson = decoratedJson.type(Person).parse({age: 10});
        const oldPerson = decoratedJson.type(Person).parse({age: 50});
        expect(youngPerson instanceof Person).toBeTruthy();
        expect(oldPerson instanceof Person).toBeTruthy();

        expect(oldPerson.isOld).toBeUndefined();
        expect(youngPerson.isOld).toBeUndefined();
        const youngPersionUntyped = JSON.parse(decoratedJson.type(Person).stringify(youngPerson));
        const oldPersonUntyped = JSON.parse(decoratedJson.type(Person).stringify(oldPerson));

        expect(youngPersionUntyped['isOld']).toBeFalsy();
        expect(oldPersonUntyped['isOld']).toBeTruthy();
    });

    it('should prefer the member method when there are both', () => {
        @jsonObject({
            beforeSerialization: 'beforeSerial',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            constructor() {
                spyOn<Person, 'beforeSerial'>(this, 'beforeSerial');
            }

            static beforeSerial() {
                // should NOT call
            }

            beforeSerial() {
                // should call
            }
        }

        spyOn(Person, 'beforeSerial');

        const youngPerson = decoratedJson.type(Person).parse({age: 10});
        expect(youngPerson instanceof Person).toBeTruthy();
        expect(youngPerson.isOld).toBeUndefined();

        const youngPersionUntyped = JSON.parse(decoratedJson.type(Person).stringify(youngPerson));

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(youngPerson.beforeSerial).toHaveBeenCalled();
        expect(youngPersionUntyped['isOld']).toBeFalsy();
        expect(Person.beforeSerial).not.toHaveBeenCalled();
    });
});
