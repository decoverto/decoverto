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

DecoratedJSON uses decorators, and requires your classes to be annotated with `@jsonObject`, and properties with `@jsonMember` (or the specific `@jsonArrayMember`, `@jsonSetMember`, and `@jsonMapMember` decorators for collections, see below). Properties which are not annotated will not be serialized or deserialized.

TypeScript needs to run with the `experimentalDecorators` and `emitDecoratorMetadata` options enabled.

### Simple class

The following example demonstrates how to annotate a basic, non-nested class for serialization, and how to serialize to JSON and back:

```typescript
import {DecoratedJson, jsonObject, jsonMember} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonMember()
    prop1: number;

    @jsonMember()
    prop2: string;
}

const decoratedJson = new DecoratedJson();
const typeHandler = decoratedJson.type(MyDataClass);

const instance = new MyDataClass();

const json = typeHandler.stringify(instance);
const instance2 = typeHandler.parse(json);

instance2 instanceof MyDataClass; // true
```

_Note: this example assumes you are using ReflectDecorators. Without it, `@jsonMember` requires a type argument, which is detailed below._

### Mapping types

At times, you might find yourself using a custom type such as `Point`, `Decimal`, or `BigInt`. In this case, `mapType` can be used to define serialization and deserialization functions. Example:

```typescript
import {DecoratedJson, jsonObject, jsonMember} from 'decorated-json';
import * as Decimal from 'decimal.js'; // Or any other library your type originates from

const decoratedJson = new DecoratedJson(); 

decoratedJson.mapType(BigInt, {
    deserializer: json => json == null ? json : BigInt(json),
    serializer: value => value == null ? value : value.toString(),
});

decoratedJson.mapType(Decimal, {
    deserializer: json => json == null ? json : new Decimal(json),
    serializer: value => value == null ? value : value.toString(),
});

@jsonObject()
class MappedTypes {

    @jsonMember()
    cryptoKey: bigint;

    @jsonMember()
    money: Decimal;
}

const result = decoratedJson.type(MappedTypes).parse({cryptoKey: '1234567890123456789', money: '12345.67'});
console.log(result.money instanceof Decimal); // true 
console.log(typeof result.cryptoKey === 'bigint'); // true 
```

Do note that in order to prevent the values from being parsed as `Number`, losing precision in the process, they have to be strings. This is a limitation of the `JSON.parse` and `JSON.stringify` functions.

### Collections

Properties which are of type Array, Set, or Map require the special `@jsonArrayMember`, `@jsonSetMember` and `@jsonMapMember` property decorators (respectively), which require a type argument for members (and keys in case of Maps). For primitive types, the type arguments are the corresponding wrapper types, which the following example showcases. Everything else works the same way:

```typescript
import {jsonObject, jsonArrayMember, jsonSetMember, jsonMapMember} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonArrayMember(() => Number)
    prop1: Array<number>;

    @jsonSetMember(() => String)
    prop2: Set<string>;
    
    @jsonMapMember(() => Number, () => MySecondDataClass)
    prop3: Map<number, MySecondDataClass>;
}
```

Sets are serialized as arrays, maps are serialized as arrays objects, each object having a `key` and a `value` property.

Multidimensional arrays require additional configuration, see Limitations below.

### Complex, nested object tree

DecoratedJSON works through your objects recursively, and can consume massively complex, nested object trees (except for some limitations with uncommon, untyped structures, see below in the limitations section).

```typescript
import {jsonObject, jsonMember, jsonArrayMember, jsonMapMember} from 'decorated-json';

@jsonObject()
class MySecondDataClass {
    @jsonMember()
    prop1: number;

    @jsonMember()
    prop2: number;
}

@jsonObject()
class MyDataClass {
    @jsonMember()
    prop1: MySecondDataClass;
    
    @jsonArrayMember(() => MySecondDataClass)
    arrayProp: MySecondDataClass[];

    @jsonMapMember(() => Number, MySecondDataClass)
    mapProp: Map<number, MySecondDataClass>;
}
```

### Any type
In case you don't want DecoratedJSON to make any conversion, the `AnyT` type can be used. 

```typescript
import {AnyT, jsonObject, jsonMember} from 'decorated-json';

@jsonObject()
class Something {
    @jsonMember(() => AnyT)
    anythingGoes: any;
}
```

### Using without ReflectDecorators

Without ReflectDecorators, `@jsonMember` requires an additional type argument, because TypeScript cannot infer it automatically:

```diff
- import 'reflect-metadata';
  import {jsonObject, jsonMember} from 'decorated-json';

  @jsonObject()
  class MyDataClass {
-     @jsonMember()
+     @jsonMember(() => Number)
      prop1: number;

-     @jsonMember()
+     @jsonMember(() => MySecondDataClass)
      public prop2: MySecondDataClass;
  }
```

### Using js objects instead of strings

Sometimes instead of serializing your data to a string you might want to get a normal javascript object. This can be especially useful when working with a framework like angular which does the stringification for you or when you want to stringify using a different library then a builtin `JSON.stringify`.

To do that DecoratedJSON exposes `toPlainJson` and friends. The return value is the one that is normally passed to stringification. For deserialization all `parse` methods apart from strings also accept javascript objects.

### Options

#### onDeserialized and beforeSerialization

On `@jsonObject` you can specify name of methods to be called before serializing the object or after it was deserialized. This method can be a static method or instance member. In case you have static and member with the same name - the member method is preferred.

#### serializer and deserializer

On `@jsonMember` decorator family you can provide your own functions to perform custom serialization and deserialization. This is similar to
[mapped types](#mapping-types) but only applies to the property on which it is declared. The example below is used to fix up data on parsing.

```typescript
import {jsonObject, jsonMember} from 'decorated-json';

@jsonObject()
class OverrideExample {
    @jsonMember({
        deserializer: json => {
            if (json == null) {
                return json;
            }

            return json === 'incorrect-data' ? 'correct' : json;
        },
        serializer: value => value,
    })
    data: string;
}
```

It is possible to only specify one of the functions. In this example, the `serializer` could be removed, and it would still work.

#### Different property name in JSON and class

You can provide a name for a property if it differs between a serialized JSON and your class definition.

```typescript
import {jsonObject, jsonMember} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonMember({name: 'api_option'})
    ownOption: string;
}
```

## Limitations

### Type-definitions

DecoratedJSON is primarily for use-cases where object-trees are defined using instantiatible classes, and thus only supports a subset of all type-definitions possible in TypeScript. Interfaces and inline type definitions, for example, are not supported, and the following is not going to work so well:

```typescript
import {jsonObject, jsonMember} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonMember()
    prop1: {prop2: {prop3: [1, 2, 3]}};
}
```

Instead, prefer creating the necessary class-structure for your object tree.

### Multi-dimensional arrays

DecoratedJSON only supports multi-dimensional arrays of a single type (can be polymorphic), and requires specifying the array dimension to do so:

```typescript
import {jsonObject, jsonArrayMember} from 'decorated-json';

@jsonObject()
class MyDataClass {
    @jsonArrayMember(Number, {dimensions: 2})
    public prop1: number[][];

    @jsonArrayMember(Number, {dimensions: 3})
    public prop2: number[][][];
}
```

### No inferred property types

If using ReflectDecorators to infer the constructor (type) of properties, it's always required to manually specify the property type:

```diff
  import {jsonObject, jsonMember} from 'decorated-json';

  @jsonObject()
  class MyDataClass {
      @jsonMember()
-     firstName = "john";
+     firstName: string = "john";
  }
```

### No support for wrapped primitives

DecoratedJSON requires type-detection and considers wrapped primitives as their corresponding primitive type. For example, `Number` is always treated as `number` (note the case-difference), and no distinction can be made.
