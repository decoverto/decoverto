import {nameof} from '../helpers';
import {OptionsBase} from '../options-base';
import {Serializable} from '../types';

export type Typelike<T extends Object> = TypeThunk<T> | TypeDescriptor<T>;
export type TypeThunk<T extends Object = any> = () => Serializable<T>;

export interface ConversionContext<Raw> {
    /**
     * Name of the object being converted, used for debugging purposes.
     */
    path?: string;
    memberOptions?: OptionsBase;
    source: Raw;
    typeMap: Map<Serializable<any>, TypeDescriptor>;
}

export abstract class TypeDescriptor<Class = any, Json = any> {
    abstract fromJson(context: ConversionContext<Json>): Class;
    abstract toJson(context: ConversionContext<Class>): Json;

    /**
     * Return a human readable name for this type descriptor. Will be used in error and debug
     * messages.
     */
    abstract getFriendlyName(): string;

    protected throwTypeMismatchError(
        {
            expectedSourceType,
            context,
        }: {
            expectedSourceType: string;
            context: ConversionContext<any>;
        },
    ): never {
        throw new TypeError(`Conversion to object failed, could not convert ${context.path} as \
${this.getFriendlyName()}. Expected ${expectedSourceType}, got \
${nameof(context.source.constructor)}.`);
    }
}

export function isTypeLike(type: any): type is Typelike<any> {
    return type != null && (typeof type === 'function' || type instanceof TypeDescriptor);
}

export function isTypeThunk(candidate: any): candidate is TypeThunk {
    return typeof candidate === 'function' && candidate.name === '';
}
