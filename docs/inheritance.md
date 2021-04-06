# Inheritance
Inheritance is supported by Decoverto, models inherit the properties of their parent. The property definition can be overridden in the child class.

When you know the type of the data you're about to convert, no special code is required. Example:

```TypeScript
import {Decoverto, model, property} from './decoverto';

@model()
class Parent {

    @property()
    parentProperty: string;
}

@model()
class Child extends Parent {

    @property()
    childProperty: string;
}

new Decoverto().type(Child).plainToInstance({
    parentProperty: 'parent',
    childProperty: 'child',
}) // Child {parentProperty: 'parent', childProperty: 'child'}
```

However, this approach is not sufficient in case you want to convert data to an unknown subclass. To accomplish conversion of more complicated inheritance, Decoverto provides the `@inherits` decorator.

## Discriminator strategy
The discriminator strategy works by defining the property responsible for distinguishing which class should be used for conversion. On the parent's `@model`, set the inheritance strategy to `discriminator`. On the subclasses, use `@inherits` to set the discriminator value. [View on the playground](https://codesandbox.io/s/github/decoverto/playground?file=/src/inheritance-discriminator.ts).

Example:

```TypeScript
import {Decoverto, inherits, model, property} from 'decoverto';

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

const decoverto = new Decoverto();
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

// Result: [
//     Bicycle {name: 'SuperVroom street Racer', saddleMaximumLengthInCm: 30}
//     Car {name: 'AF 4C 2017, entertainmentSystem: true, power: 177},
//     Car {name: 'BWM 2M 2021, entertainmentSystem: true, power: 302},
// ]
```

The discriminator key, `type` in the example, can be defined as property (e.g. `@property() readonly type: string`). No matter the value of the property when converting from an instance, it will be set to the discriminator value as defined using `@inherits`.

## Predicate strategy
This strategy allows subclasses to be selected using a predicate enabling [structural typing](https://en.wikipedia.org/wiki/Structural_type_system). When true is returned, that subclass will be used for the conversion. [View on the playground](https://codesandbox.io/s/github/decoverto/playground?file=/src/inheritance-predicate.ts)

```TypeScript
import {Decoverto, inherits, model, property} from 'decoverto';

@model({
    inheritance: {
        strategy: 'predicate',
    },
})
class Vehicle {

    @property()
    name: string;
}

@model()
class MotorVehicle extends Vehicle {

    @property()
    engineDisplacement: number;
}

@inherits({matches: data => 'maxTrailerLoad' in data})
@model()
class Truck extends MotorVehicle {

    @property()
    maxTrailerLoad: number;
}

@inherits({matches: data => 'rearGears' in data})
@model()
class Bicycle extends Vehicle {

    @property()
    rearGears: number;
}

const result = new Decoverto().type(Vehicle).plainToInstanceArray([
    {
        engineDisplacement: 13,
        maxTrailerLoad: 50000,
        name: 'Vroom S-Haul',
    },
    {
        name: 'SuperVroom Street Racer',
        rearGears: 8,
    },
]);
// Result: [
//     Truck {name: 'Vroom S-Haul, engineDisplacement: 13, maxTrailerLoad: 50000},
//     Bicycle {name: 'SuperVroom street Racer', rearGears: 8}
// ]
```

## Caveats
- **Different behavior depending on how the type handler is created**  
  Take as example this chain `A <- B <- C` with the inheritance strategy defined on `A`.
  - `.type(A)` will apply inheritance
  - `.type(B)` will only allow conversions to and from `B` instances.
  - `.type(C)` will only allow conversions to and from `C` instances.
- **If no subclass matches the discriminator or predicate, an error will be thrown.**
- **The abstract keyword has no effect**

For a deeper look into inheritance, have a look at the [inheritance tests](../spec/default/inheritance.spec.ts).
