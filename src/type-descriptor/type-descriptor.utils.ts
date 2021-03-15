import {DeferredTypeDescriptor} from './deferred.type-descriptor';
import {TypeDescriptor, Typelike} from './type-descriptor';

export function ensureTypeDescriptor(type: Typelike<any>): TypeDescriptor {
    return type instanceof TypeDescriptor ? type : new DeferredTypeDescriptor(type);
}
