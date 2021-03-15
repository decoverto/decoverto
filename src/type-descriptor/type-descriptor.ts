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
    sourceObject: Raw;
    typeMap: Map<Serializable<any>, TypeDescriptor>;
}

export abstract class TypeDescriptor<Class extends Object = any, Json = any> {
    abstract fromJson(
        context: ConversionContext<Json | null | undefined>,
    ): Class | null | undefined;
    abstract toJson(context: ConversionContext<Class | null | undefined>): Json | null | undefined;

    /**
     * Return a human readable name for this type descriptor. Will be used in error and debug
     * messages.
     */
    abstract getFriendlyName(): string;

    throwTypeMismatchError(
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
${nameof(context.sourceObject.constructor)}.`);
    }
}

export function isTypeLike(type: any): type is Typelike<any> {
    return type != null && (typeof type === 'function' || type instanceof TypeDescriptor);
}

export function isTypeThunk(candidate: any): candidate is TypeThunk {
    return typeof candidate === 'function' && candidate.name === '';
}
