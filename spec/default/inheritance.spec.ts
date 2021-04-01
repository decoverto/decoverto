import test from 'ava';

import {Decoverto, inherits, model, property} from '../../src';
import {getDiagnostic} from '../../src/diagnostics';
import {use} from '../helpers/ava.helper';

class UParent {

    @property()
    parentProperty: string;
}

@model()
class UParentDChild extends UParent {

    @property()
    childProperty: string;
}

@model()
class DParent {

    @property()
    parentProperty: string;
}

@model()
class DParentDChild extends DParent {

    @property()
    childProperty: string;
}

@model()
class DParentDChildDChild extends DParentDChild {

    @property()
    child2Property: string;
}

class DParentUChild extends DParent {

    @property()
    childProperty: string;
}

class DParentUChildUChild extends DParentDChild {

    @property()
    child2Property: string;
}

const decoverto = new Decoverto();

test('Converting a class which extends an unannotated base class should succeed', t => {
    class UEmpty {
    }

    @model()
    class Child extends UEmpty {
    }

    t.is(decoverto.type(Child).instanceToRaw(new Child()), '{}');
    t.deepEqual(decoverto.type(Child).rawToInstance('{}'), new Child());
});

test('Converting to instance with a decorated parent and child should work', t => {
    const result = decoverto.type(DParentDChild).plainToInstance({
        parentProperty: 'parent',
        childProperty: 'child',
    });

    t.is(result.childProperty, 'child');
    t.is(result.parentProperty, 'parent');
});

test('Converting a decorated subclass to plain with .type(Parent) should work', t => {
    const subject = new DParentDChild();
    subject.childProperty = 'child';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        parentProperty: 'parent',
    });
});

test('Converting a decorated subclass of a subclass to plain with .type(Parent) should work', t => {
    const subject = new DParentDChildDChild();
    subject.childProperty = 'child';
    subject.child2Property = 'child2';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        child2Property: 'child2',
        parentProperty: 'parent',
    });
});

test('Converting an undecorated subclass to plain with .type(Parent) should work', t => {
    const subject = new DParentUChild();
    subject.childProperty = 'child';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        parentProperty: 'parent',
    });
});

test('Converting DParentUChildUChild to plain with .type(Parent) should work', t => {
    const subject = new DParentUChildUChild();
    subject.childProperty = 'child';
    subject.child2Property = 'child2';
    subject.parentProperty = 'parent';
    const result = decoverto.type(DParent).instanceToPlain(subject);

    t.deepEqual(result, {
        childProperty: 'child',
        child2Property: 'child2',
        parentProperty: 'parent',
    });
});

test('Converting a decorated child of an undecorated parent with .type(Child) should work', t => {
    const subject = new UParentDChild();
    subject.parentProperty = 'parent';
    subject.childProperty = 'child';
    const result = decoverto.type(UParentDChild).instanceToPlain(subject);

    t.deepEqual(result, {
        parentProperty: 'parent',
        childProperty: 'child',
    });
});

test('Overriding property options on subclasses should work', t => {
    @model()
    class Parent {
        @property(() => String)
        data: any;
    }

    @model()
    class Child extends Parent {
        @property(() => Number)
        data: any;
    }

    const result = decoverto.type(Child).plainToInstance({
        data: 123,
    });

    t.is(result.data, 123);
});

test('@inherits should throw if no base class exists', t => {
    t.throws(() => {
        @inherits({
            discriminator: '',
        })
        @model()
        class NoParent {

        }

        use(NoParent);
    }, {
        message: getDiagnostic('inheritingModelHasNoBase', {
            typeName: 'NoParent',
        }),
    });
});

test('@inherits should throw if the base class is missing @model', t => {
    t.throws(() => {
        class Parent {
        }

        @inherits({
            discriminator: '',
        })
        @model()
        class Child extends Parent {

        }

        use(Child);
    }, {
        message: getDiagnostic('inheritedModelIsNotDecorated', {
            baseName: 'Parent',
            typeName: 'Child',
        }),
    });
});

test('@inherits should throw if the base class does not have an inheritance strategy', t => {
    t.throws(() => {
        @model()
        class Parent {
        }

        @inherits({
            discriminator: '',
        })
        @model()
        class Child extends Parent {

        }

        use(Child);
    }, {
        message: getDiagnostic('inheritedModelDoesNotHaveInheritanceStrategy', {
            baseName: 'Parent',
            typeName: 'Child',
        }),
    });
});

test('@inherits should throw on empty base class inheritance', t => {
    t.throws(() => {
        @model({
            inheritance: {} as any,
        })
        class Parent {
        }

        @inherits({
            discriminator: '',
        })
        @model()
        class Child extends Parent {

        }

        use(Child);
    }, {
        message: getDiagnostic('inheritedModelDoesNotHaveInheritanceStrategy', {
            baseName: 'Parent',
            typeName: 'Child',
        }),
    });
});

test('@inherits({discriminator}) should throw if the wrong strategy is used', t => {
    t.throws(() => {
        @model({
            inheritance: {
                strategy: 'predicate',
            },
        })
        class Parent {
        }

        @inherits({
            discriminator: '',
        })
        @model()
        class Child extends Parent {
        }

        use(Child);
    }, {
        message: getDiagnostic('inheritancePredicateStrategyMismatch', {
            baseName: 'Parent',
            typeName: 'Child',
        }),
    });
});

test('@inherits({predicate}) should throw if the wrong strategy is used', t => {
    t.throws(() => {
        @model({
            inheritance: {
                strategy: 'discriminator',
                discriminatorKey: 'type',
            },
        })
        class Parent {
        }

        @inherits({
            matches: () => true,
        })
        @model()
        class Child extends Parent {
        }

        use(Child);
    }, {
        message: getDiagnostic('inheritanceDiscriminatorStrategyMismatch', {
            baseName: 'Parent',
            typeName: 'Child',
        }),
    });
});

test(`toInstance on discriminator inheritance with the discriminator as a property on the base \
class, should work`, t => {
    @model({
        inheritance: {
            discriminatorKey: 'type',
            strategy: 'discriminator',
        },
    })
    class Person {

        @property()
        name: string;

        @property()
        type: string;
    }

    @inherits({
        discriminator: 'Employee',
    })
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const result = decoverto.type(Person).plainToInstance({
        employeeNr: '123',
        name: 'Dave',
        type: 'Employee',
    });

    t.true(result instanceof Employee);
    t.true('type' in result);
    t.is(result.name, 'Dave');
    t.is((result as any).employeeNr, '123');
});

test(`toInstance on discriminator inheritance with the discriminator not a property on the base \
class, should work`, t => {
    @model({
        inheritance: {
            discriminatorKey: 'type',
            strategy: 'discriminator',
        },
    })
    class Person {

        @property()
        name: string;
    }

    @inherits({discriminator: 'Employee'})
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const result = decoverto.type(Person).plainToInstance({
        employeeNr: '123',
        name: 'Dave',
        type: 'Employee',
    });

    t.true(result instanceof Employee);
    t.false('type' in result);
    t.is(result.name, 'Dave');
    t.is((result as any).employeeNr, '123');
});

test('toInstance on predicate inheritance should work', t => {
    @model({
        inheritance: {
            strategy: 'predicate',
        },
    })
    class Person {

        @property()
        name: string;
    }

    @inherits({
        matches(data) {
            return 'employeeNr' in data;
        },
    })
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const result = decoverto.type(Person).plainToInstance({
        name: 'Dave',
        employeeNr: '123',
    });

    t.true(result instanceof Employee);
    t.is((result as any).employeeNr, '123');
    t.is(result.name, 'Dave');
});

test(`toPlain on discriminator inheritance with the discriminator as a property on the base \
class, should work`, t => {
    @model({
        inheritance: {
            discriminatorKey: 'type',
            strategy: 'discriminator',
        },
    })
    class Person {

        @property()
        name: string;

        @property()
        type: string;
    }

    @inherits({
        discriminator: 'Employee',
    })
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const subject = new Employee();
    subject.name = 'Dave';
    subject.employeeNr = '123';
    subject.type = 'Employee';

    const result = decoverto.type(Person).instanceToPlain(subject);

    t.deepEqual(result, {
        name: 'Dave',
        employeeNr: '123',
        type: 'Employee',
    });
});

test(`toPlain on discriminator inheritance with the discriminator not a property on the base \
class, should work`, t => {
    @model({
        inheritance: {
            discriminatorKey: 'type',
            strategy: 'discriminator',
        },
    })
    class Person {

        @property()
        name: string;
    }

    @inherits({discriminator: 'Employee'})
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const subject = new Employee();
    subject.name = 'Dave';
    subject.employeeNr = '123';

    const result = decoverto.type(Person).instanceToPlain(subject);

    t.deepEqual(result, {
        employeeNr: '123',
        name: 'Dave',
        type: 'Employee',
    });
});

test('toPlain on predicate inheritance should work', t => {
    @model({
        inheritance: {
            strategy: 'predicate',
        },
    })
    class Person {

        @property()
        name: string;
    }

    @inherits({
        matches(data) {
            return 'employeeNr' in data;
        },
    })
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const subject = new Employee();
    subject.employeeNr = '123';
    subject.name = 'Dave';

    const result = decoverto.type(Person).instanceToPlain(subject);

    t.deepEqual(result, {
        employeeNr: '123',
        name: 'Dave',
    });
});

test('Inheritance should work with abstract classes', t => {
    @model({
        inheritance: {
            strategy: 'predicate',
        },
    })
    abstract class Person {

        @property()
        name: string;
    }

    @inherits({
        matches(data) {
            return 'employeeNr' in data;
        },
    })
    @model()
    class Employee extends Person {

        @property()
        employeeNr: string;
    }

    const result = decoverto.type(Person).plainToInstance({
        name: 'Dave',
        employeeNr: '123',
    });

    t.true(result instanceof Employee);
    t.is((result as any).employeeNr, '123');
    t.is(result.name, 'Dave');
});

test('Multilevel inheritance A <- abstract B <- C,D with .type(A) should work', t => {
    @model({
        inheritance: {
            discriminatorKey: 'type',
            strategy: 'discriminator',
        },
    })
    abstract class Vehicle {

        @property()
        name: string;
    }

    @model()
    abstract class MotorVehicle extends Vehicle {

        /**
         * Power in kW.
         */
        @property()
        power: number;
    }

    @inherits({discriminator: 'Car'})
    @model()
    class Car extends MotorVehicle {

        @property()
        entertainmentSystem: boolean;
    }

    @inherits({discriminator: 'Bicycle'})
    @model()
    class Bicycle extends Vehicle {

        @property()
        saddleMaximumLengthInCm: number;
    }

    const typeHandler = decoverto.type(Vehicle);
    const subject = [
        {
            name: 'SuperVroom Street Racer',
            saddleMaximumLengthInCm: 30,
            type: 'Bicycle',
        },
        {
            name: 'AF 4C 2017',
            entertainmentSystem: false,
            power: 177,
            type: 'Car',
        },
        {
            name: 'BWM 2M 2021',
            entertainmentSystem: true,
            power: 302,
            type: 'Car',
        },
    ];
    const result = typeHandler.plainToInstanceArray(subject);

    t.true(result[0] instanceof Bicycle);
    t.is((result[0] as Bicycle).saddleMaximumLengthInCm, 30);
    t.true(result[1] instanceof Car);
    t.is((result[1] as Car).entertainmentSystem, false);
    t.is((result[1] as Car).power, 177);
    t.true(result[2] instanceof Car);
    t.is((result[2] as Car).entertainmentSystem, true);
    t.is((result[2] as Car).power, 302);
    t.is((result[2] as Car).name, 'BWM 2M 2021');

    t.deepEqual(typeHandler.instanceArrayToPlain(result), subject);
});

test(`An error should be thrown on conversion from instance if the given object has the wrong type \
`, t => {
    t.throws(() => {
        @model()
        class Root {
        }

        @model()
        class NoExtend {
        }

        decoverto.type(Root).instanceToPlain(new NoExtend());
    }, {
        message: getDiagnostic('cannotConvertInstanceNotASubclass', {
            actualType: 'NoExtend',
            expectedType: 'Root',
            path: '',
        }),
    });
});

test(`An error should be thrown when converting toPlain on a nested object if the given object has \
the wrong type `, t => {
    t.throws(() => {
        @model()
        class NoExtend {
        }

        @model()
        class Wrapper {
        }

        @model()
        class Root {

            @property()
            noExtend: Wrapper;
        }

        const subject = new Root();
        subject.noExtend = new NoExtend();

        decoverto.type(Root).instanceToPlain(subject);
    }, {
        message: getDiagnostic('cannotConvertInstanceNotASubclass', {
            actualType: 'NoExtend',
            expectedType: 'Wrapper',
            path: 'Root.noExtend',
        }),
    });
});

test(`Converting a class which extends an unannotated base class by providing the base class \
should fail`, t => {
    class Parent {
    }

    @model()
    class Child extends Parent {
    }

    t.throws(() => decoverto.type(Parent).instanceToRaw(new Child()), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: Parent,
        }),
    });
    t.throws(() => decoverto.type(Parent).rawToInstance('{}'), {
        message: getDiagnostic('unknownTypeCreatingTypeHandler', {
            type: Parent,
        }),
    });
});

test(`An error should be thrown on discriminator inheritance when no subclass matches`, t => {
    t.throws(() => {
        @model({
            inheritance: {
                strategy: 'discriminator',
                discriminatorKey: 'type',
            },
        })
        class Parent {
        }

        @inherits({discriminator: 'Foo'})
        @model()
        class Foo extends Parent {
        }

        use(Foo);

        decoverto.type(Parent).plainToInstance({
            type: 'Bar',
        });
    }, {
        message: getDiagnostic('inheritanceNoMatchingDiscriminator', {
            baseName: 'Parent',
            discriminatorKey: 'type',
            discriminatorValue: 'Bar',
        }),
    });
});

test(`An error should be thrown on predicate inheritance when no subclass matches`, t => {
    t.throws(() => {
        @model({
            inheritance: {
                strategy: 'predicate',
            },
        })
        class Parent {
        }

        @inherits({matches: () => false})
        @model()
        class Foo extends Parent {
        }

        use(Foo);

        decoverto.type(Parent).plainToInstance({
            type: 'Bar',
        });
    }, {
        message: getDiagnostic('inheritanceNoMatchingPredicate', {
            baseName: 'Parent',
        }),
    });
});
