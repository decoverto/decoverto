# Parser
While the default parser of Decoverto is the builtin [JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) object, it is possible to customize and overwrite it.

## Custom parser
The parser can be specified when creating a new instance of Decoverto. Example:

```TypeScript
import {Decoverto} from 'decoverto';
import customParser from 'custom-parser';

const decoverto = new Decoverto({
    parser: {
        parse: customParser.parse,
        toRaw: customParser.toBinary,
    },
})
```

## Customize JSON parser
If you want to use a custom indent size, replacer, or reviver, the `JsonParser` class can be used.
The options of `JsonParser` match the arguments of
[`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and
[`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
All options are optional.

Example:

```TypeScript
import {Decoverto, JsonParser} from 'decoverto';

const decoverto = new Decoverto({
    parser: new JsonParser({
        replacer: replacerFn,
        reviver: reviverFn,
        spaces: 4,
    }),
});
```
