[![npm version](https://img.shields.io/npm/v/decorated-json.svg?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/decorated-json)
[![Build Status](https://img.shields.io/github/workflow/status/MatthiasKunnen/decorated-json/Node%20CI?label=CI&logo=github&style=for-the-badge)
](https://github.com/MatthiasKunnen/decorated-json/actions)
[![Build Status](https://img.shields.io/npm/l/decorated-json?&style=for-the-badge&color=green)
](https://github.com/MatthiasKunnen/decorated-json/LICENSE)

# DecoratedJSON

Converting JSON into classes and back using decorators. Annotate your data-classes with simple-to-use decorators and parse standard JSON into actual class instances. For more type-safety and less syntax, recommended to be used with [reflect-metadata](https://github.com/rbuckton/reflect-metadata), a prototype for an ES7 Reflection API for Decorator Metadata.

 - Seamlessly integrate into existing code with [decorators](https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Decorators.md), ultra-lightweight syntax
 - Parse standard JSON to class instances, safely, without requiring any type-information to be specified in the source JSON
 
## Installation

Install using:

```shell
yarn add decorated-json
```
or
```shell
npm install decorated-json
```

 - Optional: install [reflect-metadata](https://github.com/rbuckton/reflect-metadata) for additional type-safety and reduced syntax requirements. `reflect-metadata` must be available globally to work. This can usually be done with `import 'reflect-metadata'`.

## How to use

DecoratedJSON uses decorators, and requires your classes to be annotated with `@jsonObject`, and properties with `@jsonProperty`. Properties which are not annotated will not be serialized or deserialized.

TypeScript needs to run with the `experimentalDecorators` and `emitDecoratorMetadata` options enabled.

### Simple class

The following example demonstrates how to annotate a basic, non-nested, class and how to convert to JSON and back:

```typescript
import {DecoratedJson, jsonObject, jsonProperty} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonProperty()
    prop1: number;

    @jsonProperty()
    prop2: string;
}

const decoratedJson = new DecoratedJson();
const typeHandler = decoratedJson.type(MyDataClass);

const instance = new MyDataClass();

const json = typeHandler.stringify(instance);
const instance2 = typeHandler.parse(json);

instance2 instanceof MyDataClass; // true
```

_Note: this example assumes you are using ReflectDecorators. Without it, `@jsonProperty` requires a type argument, which is detailed below._

### Mapping types

At times, you might find yourself using a custom type such as `Point`, `Decimal`, or `BigInt`. To tackle this use case, DecoratedJson allows mapping a type to a custom converter. Example:

```typescript
import {ConversionContext, DecoratedJson, jsonObject, jsonProperty, SimpleTypeDescriptor} from 'decorated-json';
import * as Decimal from 'decimal.js'; // Or any other library your type originates from


class BigIntTypeDescriptor extends SimpleTypeDescriptor<bigint, string | null | undefined> {

    constructor() {
        super(BigInt);
    }

    fromJson({source}: ConversionContext<string | null | undefined>): bigint | null | undefined {
        return source == null ? source : BigInt(source);
    }

    toJson({source}: ConversionContext<bigint | null | undefined>): string | null | undefined {
        return source == null ? source : source.toString();
    }
}

class DecimalTypeDescriptor extends SimpleTypeDescriptor<Decimal, string | null | undefined> {

    constructor() {
        super(Decimal);
    }

    fromJson({source}: ConversionContext<string | null | undefined>): Decimal | null | undefined {
        return source == null ? source : new Decimal(source);
    }

    toJson({source}: ConversionContext<Decimal | null | undefined>): string | null | undefined {
        return source == null ? source : source.toString();
    }
}

const decoratedJson = new DecoratedJson();

decoratedJson.converterMap.set(BigInt, new BigIntTypeDescriptor());
decoratedJson.converterMap.set(Decimal, new DecimalTypeDescriptor());

@jsonObject()
class MappedTypes {

    @jsonProperty()
    cryptoKey: bigint;

    @jsonProperty()
    money: Decimal;
}

const result = decoratedJson.type(MappedTypes).parse({
    cryptoKey: '1234567890123456789',
    money: '12345.67',
});
console.log(typeof result.cryptoKey === 'bigint'); // true 
console.log(result.money instanceof Decimal); // true 
```

Do note that in order to prevent the values from being parsed as `Number`, losing precision in the process, they have to be strings. This is a limitation of the `JSON.parse` and `JSON.stringify` functions.

### Collections

Creating collections such as `Array`, `Map`, an `Set` can be accomplished by their respective descriptors. Example:

```typescript
import {jsonObject, array, map, set, MapShape} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonProperty(array(() => Number))
    prop1: Array<number>;

    @jsonProperty(set(() => String))
    prop2: Set<string>;

    @jsonProperty(map(() => Number, () => MySecondDataClass, {shape: MapShape.Object}))
    prop3: Map<number, MySecondDataClass>;
}
```

Sets are converted to JSON as arrays. Maps are converted as arrays objects, each object having a `key` and a `value` property.

### Complex, nested object tree

DecoratedJSON works through your objects recursively, and can consume massively complex, nested object trees.

```typescript
import {jsonObject, jsonProperty, MapShape} from 'decorated-json';

@jsonObject()
class MySecondDataClass {
    @jsonProperty()
    prop1: number;

    @jsonProperty()
    prop2: number;
}

@jsonObject()
class MyDataClass {

    @jsonProperty(array(array(() => MySecondDataClass)))
    multiDimension: Array<Array<MySecondDataClass>>;

    @jsonProperty(map(() => Number, () => MySecondDataClass, {shape: MapShape.Object}))
    mapProp: Map<number, MySecondDataClass>;

    @jsonProperty(array(map(() => Date, array(array(() => MySecondDataClass)), {shape: MapShape.Object})))
    overlyComplex: Array<Map<Date, Array<Array<MySecondDataClass>>>>;
}
```

### Any type
In case you don't want DecoratedJSON to make any conversion, the `Any` type can be used. 

```typescript
import {Any, jsonObject, jsonProperty} from 'decorated-json';

@jsonObject()
class Something {
    @jsonProperty(Any)
    anythingGoes: any;
}
```

### Using without ReflectDecorators

Without ReflectDecorators, `@jsonProperty` requires an additional type argument, because TypeScript cannot infer it automatically:

```diff
- import 'reflect-metadata';
  import {jsonObject, jsonProperty} from 'decorated-json';

  @jsonObject()
  class MyDataClass {
-     @jsonProperty()
+     @jsonProperty(() => Number)
      prop1: number;

-     @jsonProperty()
+     @jsonProperty(() => MySecondDataClass)
      public prop2: MySecondDataClass;
  }
```

### Using js objects instead of strings

Sometimes instead of stringifying data you might want to get a normal javascript object. This can be especially useful when working with a framework like angular which does the stringification for you or when you want to stringify using a different library then a builtin `JSON.stringify`.

To do that DecoratedJSON exposes `toPlainJson` and friends. The return value is the one that is normally passed to stringification. For conversion from JSON; all `parse` methods apart from strings also accept javascript objects.

### Options

#### toJson and fromJson

On `@jsonProperty` decorator family you can provide your own functions to perform custom conversion. This is similar to
[mapped types](#mapping-types) but only applies to the property on which it is declared. The example below is used to fix up data on parsing.

```typescript
import {jsonObject, jsonProperty} from 'decorated-json';

@jsonObject()
class OverrideExample {
    @jsonProperty({
        fromJson: json => {
            if (json == null) {
                return json;
            }

            return json === 'incorrect-data' ? 'correct' : json;
        },
        toJson: value => value,
    })
    data: string;
}
```

It is possible to only specify one of the functions. In this example, the `toJson` could be removed, and it would still work.

#### Different property name in JSON and class

You can provide a name for a property if it differs between the JSON property and your class definition.

```typescript
import {jsonObject, jsonProperty} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonProperty({name: 'api_option'})
    ownOption: string;
}
```

## Limitations

### Type-definitions

DecoratedJSON is primarily for use-cases where object-trees are defined using instantiatible classes, and thus only supports a subset of all type-definitions possible in TypeScript. Interfaces and inline type definitions, for example, are not supported, and the following is not going to work so well:

```typescript
import {jsonObject, jsonProperty} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonProperty()
    prop1: {prop2: {prop3: [1, 2, 3]}};
}
```

Instead, prefer creating the necessary class-structure for your object tree.

### No inferred property types

If using ReflectDecorators to infer the constructor (type) of properties, it's always required to manually specify the property type:

```diff
  import {jsonObject, jsonProperty} from 'decorated-json';

  @jsonObject()
  class MyDataClass {
      @jsonProperty()
-     firstName = "john";
+     firstName: string = "john";
  }
```

### No support for wrapped primitives

DecoratedJSON requires type-detection and considers wrapped primitives as their corresponding primitive type. For example, `Number` is always treated as `number` (note the case-difference), and no distinction can be made.
