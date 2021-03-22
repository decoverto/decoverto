import {InvalidValueError} from '../errors/invalid-value.error';
import {OptionsBase} from '../options-base';
import {Serializable} from '../types';

export type Typelike<T extends Object> = TypeThunk<T> | Converter<T>;
export type TypeThunk<T extends Object = any> = () => Serializable<T>;

export interface ConversionContext<Raw> {
    /**
     * Name of the object being converted, used for debugging purposes.
     */
    path: string;
    propertyOptions?: OptionsBase;
    source: Raw;
    converterMap: Map<Serializable<any>, Converter>;
}

export interface ThrowTypeMismatchErrorInput {
    path: string;
    source: any;
    expectedType?: string;
}

export abstract class Converter<Class = any, Json = any> {
    abstract fromJson(context: ConversionContext<Json>): Class;
    abstract toJson(context: ConversionContext<Class>): Json;

    /**
     * Return a human readable name for this converter. Will be used in error and debug messages.
     */
    abstract getFriendlyName(): string;

    protected throwTypeMismatchError(context: ThrowTypeMismatchErrorInput): never {
        throw new InvalidValueError({
            actualType: context.source?.constructor?.name,
            expectedType: context.expectedType ?? this.getFriendlyName(),
            path: context.path,
        });
    }
}

export function isTypeLike(type: any): type is Typelike<any> {
    return type != null && (typeof type === 'function' || type instanceof Converter);
}
