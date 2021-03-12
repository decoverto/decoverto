import {DecoratedJson, jsonMember, jsonObject} from '../src';

const decoratedJson = new DecoratedJson();

describe('beforeToJson', () => {
    it('should call the static method', () => {
        @jsonObject({
            beforeToJson: 'beforeToJson',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            static beforeToJson() {
                // to have been called
            }
        }

        spyOn(Person, 'beforeToJson');

        const youngPerson = decoratedJson.type(Person).parse({age: 10});
        expect(youngPerson instanceof Person).toBeTruthy();
        expect(youngPerson.isOld).toBeUndefined();
        decoratedJson.type(Person).stringify(youngPerson);

        expect(Person.beforeToJson).toHaveBeenCalled();
    });

    it('should call the member method', () => {
        @jsonObject({
            beforeToJson: 'beforeToJson',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            beforeToJson() {
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
            beforeToJson: 'beforeToJson',
        })
        class Person {
            @jsonMember()
            age: number;

            @jsonMember()
            isOld: boolean;

            constructor() {
                spyOn<Person, 'beforeToJson'>(this, 'beforeToJson');
            }

            static beforeToJson() {
                // should NOT call
            }

            beforeToJson() {
                // should call
            }
        }

        spyOn(Person, 'beforeToJson');

        const youngPerson = decoratedJson.type(Person).parse({age: 10});
        expect(youngPerson instanceof Person).toBeTruthy();
        expect(youngPerson.isOld).toBeUndefined();

        const youngPersionUntyped = JSON.parse(decoratedJson.type(Person).stringify(youngPerson));

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(youngPerson.beforeToJson).toHaveBeenCalled();
        expect(youngPersionUntyped['isOld']).toBeFalsy();
        expect(Person.beforeToJson).not.toHaveBeenCalled();
    });
});
