import {InvalidValueError} from '../errors/invalid-value.error';
import {nameof} from '../helpers';
import {OptionsBase} from '../options-base';
import {Serializable} from '../types';

export type Typelike<T extends Object> = TypeThunk<T> | TypeDescriptor<T>;
export type TypeThunk<T extends Object = any> = () => Serializable<T>;

export interface ConversionContext<Raw> {
    /**
     * Name of the object being converted, used for debugging purposes.
     */
    path: string;
    propertyOptions?: OptionsBase;
    source: Raw;
    typeMap: Map<Serializable<any>, TypeDescriptor>;
}

export interface ThrowTypeMismatchErrorInput {
    path: string;
    source: any;
    expectedType?: string;
}

export abstract class TypeDescriptor<Class = any, Json = any> {
    abstract fromJson(context: ConversionContext<Json>): Class;
    abstract toJson(context: ConversionContext<Class>): Json;

    /**
     * Return a human readable name for this type descriptor. Will be used in error and debug
     * messages.
     */
    abstract getFriendlyName(): string;

    protected throwTypeMismatchError(context: ThrowTypeMismatchErrorInput): never {
        throw new InvalidValueError({
            actualType: nameof(context.source.constructor),
            expectedType: context.expectedType ?? this.getFriendlyName(),
            path: context.path,
        });
    }
}

export function isTypeLike(type: any): type is Typelike<any> {
    return type != null && (typeof type === 'function' || type instanceof TypeDescriptor);
}
