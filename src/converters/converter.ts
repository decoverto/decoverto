import {InvalidValueError} from '../errors/invalid-value.error';
import {Serializable} from '../types';

export type Typelike<T extends {}> = TypeThunk<T> | Converter<T | null | undefined>;
export type TypeThunk<T extends {} = any> = () => Serializable<T>;

export interface ConversionContext<Raw> {
    /**
     * Name of the object being converted, used for debugging purposes.
     */
    path: string;
    source: Raw;
    converterMap: Map<Serializable<any>, Converter>;
}

export interface ThrowTypeMismatchErrorInput {
    path: string;
    source: any;
    expectedType?: string;
}

export abstract class Converter<Class = any, Plain = any> {
    abstract toInstance(context: ConversionContext<Plain>): Class;
    abstract toPlain(context: ConversionContext<Class>): Plain;

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
