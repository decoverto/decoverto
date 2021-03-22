import {Converter, Typelike} from './converter';
import {DeferredConverter} from './deferred.converter';

export function toConverter(type: Typelike<any>): Converter {
    return type instanceof Converter ? type : new DeferredConverter(type);
}
