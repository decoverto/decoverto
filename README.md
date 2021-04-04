[![npm version](https://img.shields.io/npm/v/decoverto.svg?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/decoverto)
[![Build Status](https://img.shields.io/github/workflow/status/decoverto/decoverto/Node%20CI?label=CI&logo=github&style=for-the-badge)
](https://github.com/decoverto/decoverto/actions)
[![Code coverage](https://img.shields.io/codecov/c/github/decoverto/decoverto/master?style=for-the-badge)
](https://app.codecov.io/gh/decoverto/decoverto)
[![License](https://img.shields.io/npm/l/decoverto?&style=for-the-badge&color=green)
](https://github.com/decoverto/decoverto/LICENSE)

# Decoverto
Convert data into instances of first and third party classes and back using decorators. Enjoy not having to write data-to-class setup code.

**[Test and tinker on the Decoverto playground](https://codesandbox.io/s/github/decoverto/playground?file=/index.ts)**

## Features

- [Convert object literals to and from instances](docs/conversion.md)
- [Multilevel inheritance](docs/inheritance.md)
    - [Using discriminators](docs/inheritance.md#discriminator-strategy)
    - [Using a predicate](docs/inheritance.md#predicate-strategy)
- [Reflect property types and stay DRY](docs/defining-properties.md#reflect-metadata)
- [Make your own converters](docs/defining-properties.md#mapping-types) <small>Handy for third-party types</small>
- Supports circular references
- Builtin support for:
  - `number`, `string`, `Date`, `ArrayBuffer`, `DataView`
  - [Collections such as `Array`, `Set`, `Map`](docs/defining-properties.md#collections)
  - [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)
- Convert any raw data:
    - [Use your own parser](docs/parser.md#custom-parser)
    - [Configure the default JSON parser](docs/parser.md#customize-json-parser)
- Works in browser and Node
- Use TypeScript ([playground](https://codesandbox.io/s/github/decoverto/playground?file=/index.ts)) or JavaScript with Babel ([playground](https://codesandbox.io/s/github/decoverto/example-javascript?file=/index.js))


A model looks like this:

```TypeScript
import {model, map, MapShape, property} from 'decoverto';

@model()
class User {

    @property()
    createdAt: Date;

    @property()
    givenName: string;

    @property(() => String)
    referralToken: string | null;

    @property(map(() => String, () => Boolean, {shape: MapShape.Object}))
    permissions: Map<string, boolean>;
}
```

### Quickstart

1. Install decoverto

   ```shell
   yarn add decoverto
   ```
   or
    ```shell
    npm install decoverto
    ```

1. When using TypeScript, enable `experimentalDecorators` in `tsconfig.json`
1. Define a model

    ```TypeScript
    import {model, map, MapShape, property} from 'decoverto';

    @model()
    class User {

        @property(() => Date)
        createdAt: Date;

        @property(() => String)
        givenName: string;

        @property(() => String)
        referralToken: string | null;

        @property(map(() => String, () => Boolean, {shape: MapShape.Object}))
        permissions: Map<string, boolean>;
    }
    ```

1. Create a Decoverto instance `const decoverto = new Decoverto()`
1. Convert some data

   ```TypeScript
   // Convert raw data using the default JSON parser
   user = decoverto.type(User).rawToInstance(`{
       "createdAt": "2021-03-31T14:08:42.009Z",
       "givenName": "Mark",
       "referralToken": null,
       "permissions": {
           "canManageUsers": true,
           "canCreateProducts": true
       }
   }`);

   // Convert an object literal
   user = decoverto.type(User).plainToInstance({
       createdAt: new Date(),
       givenName: 'Mark',
       referralToken: null,
       permissions: {
           canManageUsers: true,
           canCreateProducts: true,
       }
   });
   ```

For more information, see links in the [features list](#features) or the [docs directory](docs).

## Examples/Playground

Decoverto has playgrounds where you can view examples and tinker with them. It allows you to see what is possible and experiment.
- [TypeScript playground](https://codesandbox.io/s/github/decoverto/playground?file=/index.ts) This is the main playground.
- [JavaScript + Babel playground](https://codesandbox.io/s/github/decoverto/example-javascript?file=/index.js)
