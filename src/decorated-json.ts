import {JsonHandler} from './json-handler';
import {ArrayBufferTypeDescriptor} from './type-descriptor/array-buffer.type-descriptor';
import {DataViewTypeDescriptor} from './type-descriptor/data-view.type-descriptor';
import {DateTypeDescriptor} from './type-descriptor/date.type-descriptor';
import {DirectTypeDescriptor} from './type-descriptor/direct.type-descriptor';
import {TypeDescriptor} from './type-descriptor/type-descriptor';
import {TypedArrayTypeDescriptor} from './type-descriptor/typed-array.type-descriptor';
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

    readonly converterMap = new Map<Serializable<any>, TypeDescriptor>([
        [Boolean, new DirectTypeDescriptor(Boolean)],
        [Date, new DateTypeDescriptor()],
        [Number, new DirectTypeDescriptor(Number)],
        [String, new DirectTypeDescriptor(String)],
        [ArrayBuffer, new ArrayBufferTypeDescriptor()],
        [DataView, new DataViewTypeDescriptor()],

        // typed arrays
        [Float32Array, new TypedArrayTypeDescriptor(Float32Array)],
        [Float64Array, new TypedArrayTypeDescriptor(Float64Array)],
        [Int8Array, new TypedArrayTypeDescriptor(Int8Array)],
        [Uint8Array, new TypedArrayTypeDescriptor(Uint8Array)],
        [Uint8ClampedArray, new TypedArrayTypeDescriptor(Uint8ClampedArray)],
        [Int16Array, new TypedArrayTypeDescriptor(Int16Array)],
        [Uint16Array, new TypedArrayTypeDescriptor(Uint16Array)],
        [Int32Array, new TypedArrayTypeDescriptor(Int32Array)],
        [Uint32Array, new TypedArrayTypeDescriptor(Uint32Array)],
    ]);

    constructor(
        private readonly settings: DecoratedJsonSettings = {},
    ) {
    }

    type<T>(type: Serializable<T>): TypeHandler<T> {
        return new TypeHandler<T>(type, {
            conversionMap: this.converterMap,
            jsonHandler: this.settings.jsonHandler,
        });
    }
}
