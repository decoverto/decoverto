import {ArrayBufferConverter} from './converters/array-buffer.converter';
import {Converter} from './converters/converter';
import {DataViewConverter} from './converters/data-view.converter';
import {DateConverter} from './converters/date.converter';
import {DirectConverter} from './converters/direct.converter';
import {TypedArrayConverter} from './converters/typed-array.converter';
import {JsonParser, Parser} from './parser';
import {TypeHandler} from './type-handler';
import {Serializable} from './types';

interface DecovertoSettings<Raw> {

    /**
     * Configure the parser used to convert data from raw to plain and reverse. Expects a
     * class implementing `Parser`. Example setting JSON parser indent level:
     * ```TypeScript
     * import {JsonParser} from 'decoverto';
     *
     * const parser = new JsonParser({
     *     spaces: 4,
     * });
     * @default The JSON parser without indent.
     * ```
     */
    parser: Parser<Raw>;
}

export class Decoverto<Raw = string> {

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

    private readonly settings: DecovertoSettings<Raw>;

    constructor(
        settings: Partial<DecovertoSettings<Raw>> = {},
    ) {
        this.settings = {
            ...settings,
            // We cannot check if the user has typed Raw incorrectly so let's assume they didn't
            parser: settings.parser ?? new JsonParser({}) as unknown as Parser<Raw>,
        };
    }

    type<T extends {}>(type: Serializable<T>): TypeHandler<T, Raw> {
        return new TypeHandler<T, Raw>(type, {
            parser: this.settings.parser,
            converterMap: this.converterMap,
        });
    }
}
