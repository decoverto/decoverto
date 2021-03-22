import {ArrayBufferConverter} from './converters/array-buffer.converter';
import {Converter} from './converters/converter';
import {DataViewConverter} from './converters/data-view.converter';
import {DateConverter} from './converters/date.converter';
import {DirectConverter} from './converters/direct.converter';
import {TypedArrayConverter} from './converters/typed-array.converter';
import {JsonHandler} from './json-handler';
import {TypeHandler} from './type-handler';
import {Serializable} from './types';

interface DecoratedJsonSettings {

    /**
     * Used to configure reviver, replacer, and spaces used in `JSON` methods or use a custom
     * JSON parser. Expects a class implementing `JsonHandler`. Example:
     * ```TypeScript
     * import {JsonHandlerSimple} from 'decorated-json';
     *
     * const jsonHandler = new JsonHandlerSimple({
     *     spaces: 4,
     * });
     * ```
     */
    jsonHandler?: JsonHandler;
}

export class DecoratedJson {

    /**
     * Maps a type to its respective converter.
     */
    readonly converterMap = new Map<Serializable<any>, Converter>([
        [Boolean, new DirectConverter(Boolean)],
        [Date, new DateConverter()],
        [Number, new DirectConverter(Number)],
        [String, new DirectConverter(String)],
        [ArrayBuffer, new ArrayBufferConverter()],
        [DataView, new DataViewConverter()],

        // typed arrays
        [Float32Array, new TypedArrayConverter(Float32Array)],
        [Float64Array, new TypedArrayConverter(Float64Array)],
        [Int8Array, new TypedArrayConverter(Int8Array)],
        [Uint8Array, new TypedArrayConverter(Uint8Array)],
        [Uint8ClampedArray, new TypedArrayConverter(Uint8ClampedArray)],
        [Int16Array, new TypedArrayConverter(Int16Array)],
        [Uint16Array, new TypedArrayConverter(Uint16Array)],
        [Int32Array, new TypedArrayConverter(Int32Array)],
        [Uint32Array, new TypedArrayConverter(Uint32Array)],
    ]);

    constructor(
        private readonly settings: DecoratedJsonSettings = {},
    ) {
    }

    type<T>(type: Serializable<T>): TypeHandler<T> {
        return new TypeHandler<T>(type, {
            jsonHandler: this.settings.jsonHandler,
            converterMap: this.converterMap,
        });
    }
}
