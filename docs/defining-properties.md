# Defining properties
Properties are defined using the `@property` decorator.

The order in which the type is determined is as follows, from lowest to highest precedence:

1. The type reflected by `reflect-metadata`, if enabled
1. The type specified on the decorator, e.g. `@property(() => String)`
1. The converter specified on the decorator, e.g. `@property({toPlain: () => 'Overriden'})`

## Reflect metadata
The optional [reflect-metadata](https://www.typescriptlang.org/docs/handbook/decorators.html#metadata) package enables Decoverto to determine the type of the property by looking at the type definition. e.g. with the property definition `@property() property: string`, Decoverto can determine that the type is `string`. When using TypeScript, the compiler option `emitDecoratorMetadata` must be enabled. The following limitations apply:

- Only simple types such as a single class or builtin can be reflected. E.g.
    - string
    - number
    - Date
    - SomeModel

  Unions, intersections, type literals, etc. cannot be reflected.

- The type cannot be reflected from a default value and must be explicitly defined

    ```diff
     import {model, property} from 'decoverto';

     @model()
     class MyDataClass {
         @property()
    -    firstName = 'default';
    +    firstName: string = 'default';
     }
    ```

## Passing the type to the decorator
Setting the type of a property can be accomplished using the first parameter, e.g. `@property(() => Foo)`. The parameter is an arrow function returning the type. The arrow function is used to defer processing of the type allowing for circular references.

### Collections
Defining collections such as `Array`, `Map`, an `Set` can be accomplished by their respective converters. [View on the playground](https://codesandbox.io/s/github/decoverto/playground?file=/src/nested-class.ts)

```typescript
import {model, array, map, set, MapShape} from 'decoverto';

@model()
class Bar {
    @property()
    prop1: number;

    @property()
    prop2: number;
}


@model()
class Foo {
    @property(array(() => Number))
    prop1: Array<number>;

    @property(set(() => String))
    prop2: Set<string>;

    @property(map(() => Number, () => Bar, {shape: MapShape.Object}))
    prop3: Map<number, Bar>;
}
```

These converter functions; `array`, `set`, `map` can be nested to define complex structures:

```TypeScript
import {model, property, MapShape, array, map} from 'decoverto';

@model()
class Foo {

    @property(array(array(() => Bar)))
    multiDimension: Array<Array<Bar>>;

    @property(map(() => Number, () => Bar, {shape: MapShape.Array}))
    mapProp: Map<number, Bar>;

    @property(array(map(() => Date, array(array(() => Bar)), {shape: MapShape.Array})))
    overlyComplex: Array<Map<Date, Array<Array<Bar>>>>;
}
```

#### Map shape
The map's shape defines how it is converted.

##### MapShape.Array
A map will be converted as an array of key value pairs. E.g. `map: Map<string, number>` is represented as:
```json
{
  "map": [
    {
      "key": "key",
      "value": 5
    }
  ]
}
```

##### MapShape.Object
A map will be converted as an object. E.g. `map: Map<string, string>` is represented as:
```json
{
  "map": {
    "key": 5
  }
}
```

### Date
When converting to instance, the value can be either a number (unix timestamp) or string ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)). The conversion back to the raw type, however, will always result in a ISO 8601 string. If you want to change this behavior, override the [default converter](src/converters/date.converter.ts) using the [converter map explained below](#mapping-types).

### Any
In case you don't want Decoverto to make any conversion, the `Any` type can be used.

```TypeScript
import {Any, model, property} from 'decoverto';

@model()
class Something {
    @property(Any)
    anythingGoes: any;
}
```

## Mapping types

To convert third-party types (e.g. `Point`, `Decimal`, or `BigInt`), or handle conversion of a class yourself, Decoverto allows mapping a type to a custom converter. [View on playground](https://codesandbox.io/s/github/decoverto/playground?file=/src/mapped-types.ts).

```typescript
import {ConversionContext, Decoverto, model, property, SimpleConverter} from 'decoverto';
import Decimal from 'bignumber.js'; // Or any other library your type originates from

class BigIntConverter extends SimpleConverter<bigint, string | null | undefined> {

    constructor() {
        super(BigInt);
    }

    toInstance({source}: ConversionContext<string | null | undefined>): bigint | null | undefined {
        return source == null ? source : BigInt(source);
    }

    toPlain({source}: ConversionContext<bigint | null | undefined>): string | null | undefined {
        return source == null ? source : source.toString();
    }
}

class DecimalConverter extends SimpleConverter<Decimal, string | null | undefined> {

    constructor() {
        super(Decimal);
    }

    toInstance({source}: ConversionContext<string | null | undefined>): Decimal | null | undefined {
        return source == null ? source : new Decimal(source);
    }

    toPlain({source}: ConversionContext<Decimal | null | undefined>): string | null | undefined {
        return source == null ? source : source.toString();
    }
}

const decoverto = new Decoverto();

decoverto.converterMap.set(BigInt, new BigIntConverter());
decoverto.converterMap.set(Decimal, new DecimalConverter());

@model()
class MappedTypes {

    @property()
    cryptoKey: bigint;

    @property()
    money: Decimal;
}

const result = decoverto.type(MappedTypes).plainToInstance({
    cryptoKey: '1234567890123456789',
    money: '12345.67',
});
console.log(typeof result.cryptoKey === 'bigint'); // true
console.log(result.money instanceof Decimal); // true
```

Do note that in order to prevent the values from being parsed as `Number`, losing precision in the process, they have to be strings. This is a limitation of the `JSON.parse` and `JSON.stringify` functions which are used by default unless you've [configured a custom parser](./parser.md).

## Options

### Overriding converters with toInstance and toPlain

On the `@property` decorator, you can provide your own functions to perform custom conversion. This is similar to [mapped types](#mapping-types) but only applies to the property on which it is declared. The example below is used to fix up data on parsing.

```typescript
import {model, property} from 'decoverto';

@model()
class OverrideExample {
    @property({
        toInstance: data => {
            if (data == null) {
                return data;
            }

            return data === 'incorrect-data' ? 'correct' : data;
        },
        toPlain: value => value,
    })
    data: string;
}
```

It is possible to only override one of the functions. In this example, the `toPlain` could be removed, and it would still work.

### Different property name in class

You can provide a name for a property if it differs between the data and your class definition.

```typescript
import {model, property} from 'decoverto';

@model()
class MyDataClass {
    @property({plainName: 'api_option'})
    ownOption: string;
}
```
